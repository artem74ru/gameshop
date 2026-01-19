import { getRouterParams, getQuery } from 'h3'
// defineCachedEventHandler доступен через auto-imports в Nuxt 3
import { useRawgClient } from '../../utils/rawgClient'
import { hasSexualContent } from '../../utils/contentFilter'
import { generatePriceFromId } from '../../utils/price'

interface RawgGameDetail {
    id: number
    slug: string
    name: string
    description_raw: string
    rating: number
    released: string
    website: string
    background_image: string
    background_image_additional?: string | null
    short_screenshots?: Array<{ image: string }>
    platforms?: Array<{ platform: { name: string } }>
    genres?: Array<{ id: number; name: string; slug: string }>
    developers?: Array<{ id: number; name: string; slug: string }>
    publishers?: Array<{ id: number; name: string; slug: string }>
    game_series?: Array<{ id: number; name: string; slug: string }>
    parent_game?: { id: number; name: string; slug: string }
    tags?: Array<{ slug: string; name: string }>
    esrb_rating?: { id: number; name: string; slug: string } | null
}

interface RawgScreenshots {
    results: Array<{ image: string }>
}

interface RawgMovie {
    id: number
    name: string
    preview: string
    data: {
        480: string
        max: string
    }
}

interface RawgMovies {
    results: RawgMovie[]
}

// Используем defineCachedEventHandler из Nitro для кеширования
// TTL: 600 секунд (10 минут) - увеличено для защиты от блокировок API
export default defineCachedEventHandler(async (event) => {
    try {
        const { slug } = getRouterParams(event)
        const query = getQuery(event)
        
        const { get } = useRawgClient()

        // Используем увеличенный таймаут и retry для получения деталей игры
        const game = await get(`/games/${slug}`, {}, { timeout: 20000, retries: 2 }) as RawgGameDetail
        
        // Проверяем, содержит ли игра сексуальный контент
        if (hasSexualContent(game.tags)) {
            throw createError({
                statusCode: 404,
                statusMessage: 'Игра не найдена'
            })
        }
        
        // Используем увеличенные таймауты для скриншотов и видео (они менее критичны)
        const screenshots = await get(`/games/${slug}/screenshots`, { page_size: 10 }, { timeout: 15000, retries: 1 }) as RawgScreenshots
        
        // Получаем видео/трейлеры
        let movies: RawgMovies | null = null
        let trailerUrl: string | null = null
        try {
            movies = await get(`/games/${slug}/movies`, { page_size: 5 }, { timeout: 15000, retries: 1 }) as RawgMovies
            if (movies && movies.results && movies.results.length > 0) {
                // RAWG API возвращает видео в формате data.max или data[480]
                // Это прямые ссылки на видеофайлы, которые можно использовать в <video> теге
                // Для iframe нужно использовать YouTube или другой видеохостинг
                const videoData = movies.results[0].data
                trailerUrl = videoData.max || videoData[480] || null
            }
        } catch (error) {
            // Если видео нет, просто игнорируем ошибку
            console.log(`No videos found for game ${slug}`)
        }

        // Проверяем, является ли игра DLC
        const isDLC = game.parent_game !== undefined || 
                     game.tags?.some(tag => 
                         tag.slug === 'dlc' || 
                         tag.slug === 'add-on' ||
                         tag.name.toLowerCase().includes('dlc')
                     ) ||
                     game.name.toLowerCase().includes('dlc') ||
                     game.name.toLowerCase().includes('add-on') ||
                     game.slug.toLowerCase().includes('dlc')

        // Определяем основную игру
        let parentGame = null
        if (game.parent_game) {
            parentGame = {
                id: game.parent_game.id,
                name: game.parent_game.name,
                slug: game.parent_game.slug
            }
        } else if (isDLC && game.game_series && game.game_series.length > 0) {
            // Если нет parent_game, но есть серия, пытаемся найти основную игру
            // Обычно основная игра - это первая в серии или та, которая не содержит DLC в названии
            const mainGame = game.game_series.find(g => 
                !g.name.toLowerCase().includes('dlc') && 
                !g.name.toLowerCase().includes('add-on')
            ) || game.game_series[0]
            
            if (mainGame) {
                try {
                    const mainGameDetail = await get(`/games/${mainGame.slug}`) as { id: number; slug: string; name: string }
                    parentGame = {
                        id: mainGameDetail.id,
                        name: mainGameDetail.name,
                        slug: mainGameDetail.slug
                    }
                } catch (e) {
                    // Если не удалось получить детали, используем данные из серии
                    parentGame = {
                        id: mainGame.id,
                        name: mainGame.name,
                        slug: mainGame.slug
                    }
                }
            }
        }

        // Генерируем случайную цену на основе ID игры (CheapShark временно отключен)
        const generatedPrice = generatePriceFromId(game.id)

        const response = {
            game: {
                id: game.id,
                slug: game.slug,
                name: game.name,
                description: game.description_raw,
                rating: game.rating,
                released: game.released,
                price: generatedPrice,
                originalPrice: undefined,
                discount: undefined,
                priceSource: 'generated',
                storeName: undefined,
                storeURL: undefined,
                stores: undefined,
                website: game.website,
                // Приоритет: официальная обложка (short_screenshots[0]) > background_image > первый скриншот > background_image_additional
                backgroundImage: (game.short_screenshots && game.short_screenshots.length > 0 && game.short_screenshots[0]?.image) 
                    || game.background_image 
                    || (screenshots.results && screenshots.results.length > 0 ? screenshots.results[0]?.image : null)
                    || (game as any).background_image_additional 
                    || '',
                platforms: (game.platforms ?? []).map((p) => p.platform.name),
                genres: (game.genres ?? []).map((g) => ({ id: g.id, name: g.name, slug: g.slug })),
                developer: game.developers && game.developers.length > 0 ? game.developers[0].name : null,
                publisher: game.publishers && game.publishers.length > 0 ? game.publishers[0].name : null,
                screenshots: screenshots.results.map((s) => s.image),
                trailer: movies && movies.results.length > 0 ? movies.results[0].data.max || movies.results[0].data[480] : null,
                trailerPreview: movies && movies.results.length > 0 ? movies.results[0].preview : null,
                gameSeries: game.game_series?.[0] || null,
                isDLC,
                parentGame,
                ageRating: game.esrb_rating?.name || null,
                tags: game.tags || []
            }
        }
        
        return response
    } catch (error) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Игра не найдена',
            data: error
        })
    }
}, {
    maxAge: 600, // 600 секунд (10 минут) - увеличено для защиты от блокировок API
    getKey: (event) => {
        const { slug } = getRouterParams(event)
        const query = getQuery(event)
        return `${slug}-${query.priceStrategy || 'hybrid'}`
    }
})
