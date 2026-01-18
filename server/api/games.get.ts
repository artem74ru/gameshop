import { getQuery } from 'h3'
// defineCachedEventHandler доступен через auto-imports в Nuxt 3
import { useRawgClient } from '../utils/rawgClient'
import { filterSexualContent } from '../utils/contentFilter'
import { generatePriceFromId } from '../utils/price'

interface RawgGame {
    id: number
    slug: string
    name: string
    released: string
    rating: number
    background_image: string
    background_image_additional?: string | null
    short_screenshots?: Array<{ image: string }>
    platforms?: Array<{ platform: { name: string } }>
    genres?: Array<{ id: number; name: string; slug: string }>
    tags?: Array<{ slug: string; name: string }>
    esrb_rating?: { id: number; name: string; slug: string } | null
}

interface RawgResponse {
    results: RawgGame[]
    count: number
}

// Используем defineCachedEventHandler из Nitro для кеширования
// TTL: 300 секунд (5 минут) - увеличено для защиты от блокировок API
export default defineCachedEventHandler(async (event) => {
    try {
        const query = getQuery(event)

        const page = Number(query.page ?? 1)
        const pageSize = Number(query.pageSize ?? 20)
        const search = query.search ? String(query.search) : undefined
        const platforms = query.platforms ? String(query.platforms) : undefined
        const genres = query.genres ? String(query.genres) : undefined
        const publishers = query.publishers ? String(query.publishers) : undefined
        const developers = query.developers ? String(query.developers) : undefined
        const stores = query.stores ? String(query.stores) : undefined
        const dates = query.dates ? String(query.dates) : undefined
        const metacritic = query.metacritic ? String(query.metacritic) : undefined
        const tags = query.tags ? String(query.tags) : undefined
        const rating = query.rating ? String(query.rating) : undefined
        const sort = String(query.sort ?? '')

        const orderingMap: Record<string, string> = {
            rating_desc: '-rating',
            rating_asc: 'rating',
            release_desc: '-released',
            release_asc: 'released',
            name_asc: 'name',
            name_desc: '-name',
            metacritic_desc: '-metacritic',
            metacritic_asc: 'metacritic'
        }

        const ordering = orderingMap[sort]

        const { get } = useRawgClient()

        const rawg = await get('/games', {
            page,
            page_size: pageSize,
            search,
            ordering,
            platforms,
            genres,
            publishers,
            developers,
            stores,
            dates,
            metacritic,
            tags,
            rating
        }) as RawgResponse

        // Генерируем случайные цены (CheapShark временно отключен)

        // Фильтруем игры с сексуальным контентом
        const filteredResults = filterSexualContent(rawg.results)

        // Фильтруем и обогащаем игры
        // Если CheapShark включен - показываем только игры с ценами
        // Если CheapShark отключен - показываем все игры (для разработки)
        const results = filteredResults
            .map((g) => {
                // Проверяем, является ли игра DLC
                // Проверка по тегам (если они есть в ответе)
                const hasDLCTag = g.tags?.some(tag => {
                    const tagSlug = tag.slug?.toLowerCase() || ''
                    const tagName = tag.name?.toLowerCase() || ''
                    return tagSlug.includes('dlc') || 
                           tagSlug.includes('add-on') || 
                           tagSlug.includes('addon') ||
                           tagName.includes('dlc') ||
                           tagName.includes('add-on') ||
                           tagName.includes('addon')
                }) || false

                // Проверка по названию игры
                const gameNameLower = g.name.toLowerCase()
                const hasDLCInName = gameNameLower.includes('dlc') || 
                                     gameNameLower.includes('add-on') ||
                                     gameNameLower.includes('addon') ||
                                     gameNameLower.includes('expansion') ||
                                     gameNameLower.includes('expansion pack') ||
                                     gameNameLower.includes('season pass') ||
                                     gameNameLower.includes('pack') ||
                                     gameNameLower.includes('bundle')

                // Проверка по slug
                const gameSlugLower = g.slug.toLowerCase()
                const hasDLCInSlug = gameSlugLower.includes('dlc') ||
                                     gameSlugLower.includes('add-on') ||
                                     gameSlugLower.includes('addon')

                const isDLC = hasDLCTag || hasDLCInName || hasDLCInSlug

                // Генерируем случайную цену на основе ID игры
                const generatedPrice = generatePriceFromId(g.id)

                // Извлекаем возрастной рейтинг
                const ageRating = g.esrb_rating?.name || null

                // Приоритет изображения: официальная обложка (short_screenshots[0]) > background_image > background_image_additional
                const gameImage = (g.short_screenshots && g.short_screenshots.length > 0 && g.short_screenshots[0]?.image)
                    || g.background_image
                    || (g as any).background_image_additional
                    || ''

                return {
                    id: g.id,
                    slug: g.slug,
                    name: g.name,
                    released: g.released,
                    rating: g.rating,
                    backgroundImage: gameImage,
                    platforms: (g.platforms ?? []).map((p) => p.platform.name),
                    genres: (g.genres ?? []).map((gen) => ({ id: gen.id, name: gen.name, slug: gen.slug })),
                    price: generatedPrice,
                    originalPrice: undefined,
                    discount: undefined,
                    priceSource: 'generated',
                    storeName: undefined,
                    storeURL: undefined,
                    stores: undefined,
                    isDLC,
                    ageRating,
                    tags: g.tags || []
                }
            })

        // Обновляем total на основе реального количества отфильтрованных игр
        // Если CheapShark включен и мы фильтруем по ценам, пересчитываем total
        // Используем исходное количество из RAWG API
        // (не фильтруем по ценам на сервере, показываем все игры)
        const filteredTotal = rawg.count

        return {
            results,
            page,
            pageSize,
            total: filteredTotal
        }
    } catch (error) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Ошибка при загрузке игр',
            data: error
        })
    }
}, {
    maxAge: 300, // 300 секунд (5 минут) - увеличено для защиты от блокировок API
    getKey: (event) => {
        const query = getQuery(event)
        return JSON.stringify({
            page: query.page || 1,
            pageSize: query.pageSize || 20,
            search: query.search || '',
            sort: query.sort || '',
            platforms: query.platforms || '',
            genres: query.genres || '',
            publishers: query.publishers || '',
            developers: query.developers || '',
            stores: query.stores || '',
            tags: query.tags || '',
            dates: query.dates || '',
            metacritic: query.metacritic || '',
            rating: query.rating || '',
            priceStrategy: query.priceStrategy || 'hybrid'
        })
    }
})
