import { defineEventHandler, setHeader } from 'h3'
import { fetchAllResults } from '../utils/fetchAllResults'

interface RawgPublisher {
    id: number
    name: string
    slug: string
    games_count: number
}

interface RawgPublishersResponse {
    results: RawgPublisher[]
    count: number
}

// Кеш для издателей (меняются редко)
let publishersCache: { data: any; timestamp: number } | null = null
const PUBLISHERS_CACHE_TTL = 3600 * 1000 // 1 час

export default defineEventHandler(async (event) => {
    try {
        // Проверяем кеш
        if (publishersCache && Date.now() - publishersCache.timestamp < PUBLISHERS_CACHE_TTL) {
            setHeader(event, 'X-Cache', 'HIT')
            setHeader(event, 'Cache-Control', 'public, max-age=3600, s-maxage=3600')
            return publishersCache.data
        }
        
        setHeader(event, 'X-Cache', 'MISS')
        setHeader(event, 'Cache-Control', 'public, max-age=3600, s-maxage=3600')
        
        // Получаем всех издателей через пагинацию
        const allPublishers = await fetchAllResults<RawgPublisher>('/publishers', {}, 40)

        const result = {
            results: allPublishers
                .filter(p => p.games_count > 0)
                .map((p) => ({
                    id: p.id,
                    name: p.name,
                    slug: p.slug,
                    gamesCount: p.games_count
                }))
                .sort((a, b) => b.gamesCount - a.gamesCount)
        }
        
        // Сохраняем в кеш
        publishersCache = {
            data: result,
            timestamp: Date.now()
        }
        
        return result
    } catch (error) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Ошибка при загрузке издателей',
            data: error
        })
    }
})
