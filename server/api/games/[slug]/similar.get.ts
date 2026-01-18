import { defineEventHandler, getRouterParams } from 'h3'
import { useRawgClient } from '../../../utils/rawgClient'
import { generatePriceFromId } from '../../../utils/price'
import { filterSexualContent } from '../../../utils/contentFilter'

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

export default defineEventHandler(async (event) => {
    try {
        const { slug } = getRouterParams(event)
        const { get } = useRawgClient()

        // Сначала получаем ID игры
        const gameDetail = await get(`/games/${slug}`) as { id: number; genres?: Array<{ id: number }> }
        
        // Получаем похожие игры через suggested endpoint (требует ID)
        let similarData: RawgResponse
        try {
            similarData = await get(`/games/${gameDetail.id}/suggested`, { page_size: 20 }) as RawgResponse
        } catch (e) {
            // Если suggested не работает, используем поиск по жанрам
            if (gameDetail.genres && gameDetail.genres.length > 0) {
                const genreIds = gameDetail.genres.map(g => g.id).join(',')
                similarData = await get('/games', {
                    genres: genreIds,
                    page_size: 20,
                    ordering: '-rating'
                }) as RawgResponse
                
                // Исключаем текущую игру
                similarData.results = similarData.results.filter(g => g.slug !== slug)
            } else {
                throw new Error('No genres found')
            }
        }

        // Фильтруем игры с сексуальным контентом
        const filteredResults = filterSexualContent(similarData.results)
        
        const results = filteredResults
            .filter(g => g.slug !== slug) // Исключаем текущую игру
            .slice(0, 20)
            .map((g) => {
                // Приоритет изображения: официальная обложка (short_screenshots[0]) > background_image > background_image_additional
                const gameImage = (g.short_screenshots && g.short_screenshots.length > 0 && g.short_screenshots[0]?.image)
                    || g.background_image
                    || g.background_image_additional
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
                    price: generatePriceFromId(g.id),
                    ageRating: g.esrb_rating?.name || null,
                    tags: g.tags || []
                }
            })

        return {
            results,
            count: results.length
        }
    } catch (error) {
        console.error('Error loading similar games:', error)
        return {
            results: [],
            count: 0
        }
    }
})

