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

        // Получаем ID игры сначала
        const gameDetail = await get(`/games/${slug}`) as { id: number }
        
        // Получаем DLC и дополнения
        const dlcData = await get(`/games/${gameDetail.id}/additions`, { page_size: 20 }) as RawgResponse

        // Фильтруем игры с сексуальным контентом
        const filteredDlc = filterSexualContent(dlcData.results)

        const results = filteredDlc.map((g) => {
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
                isDLC: true,
                ageRating: g.esrb_rating?.name || null,
                tags: g.tags || []
            }
        })

        return {
            results,
            count: results.length
        }
    } catch (error) {
        // Если нет DLC, возвращаем пустой массив
        return {
            results: [],
            count: 0
        }
    }
})

