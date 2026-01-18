import { defineEventHandler, setHeader } from 'h3'
import { fetchAllResults } from '../utils/fetchAllResults'

interface RawgDeveloper {
    id: number
    name: string
    slug: string
    games_count: number
}

interface RawgDevelopersResponse {
    results: RawgDeveloper[]
    count: number
}

// Кеш для разработчиков (меняются редко)
let developersCache: { data: any; timestamp: number } | null = null
const DEVELOPERS_CACHE_TTL = 3600 * 1000 // 1 час

export default defineEventHandler(async (event) => {
    try {
        // Проверяем кеш
        if (developersCache && Date.now() - developersCache.timestamp < DEVELOPERS_CACHE_TTL) {
            setHeader(event, 'X-Cache', 'HIT')
            setHeader(event, 'Cache-Control', 'public, max-age=3600, s-maxage=3600')
            return developersCache.data
        }
        
        setHeader(event, 'X-Cache', 'MISS')
        setHeader(event, 'Cache-Control', 'public, max-age=3600, s-maxage=3600')
        
        // Получаем всех разработчиков через пагинацию
        const allDevelopers = await fetchAllResults<RawgDeveloper>('/developers', {}, 40)

        const result = {
            results: allDevelopers
                .filter(d => d.games_count > 0)
                .map((d) => ({
                    id: d.id,
                    name: d.name,
                    slug: d.slug,
                    gamesCount: d.games_count
                }))
                .sort((a, b) => b.gamesCount - a.gamesCount)
        }
        
        // Сохраняем в кеш
        developersCache = {
            data: result,
            timestamp: Date.now()
        }
        
        return result
    } catch (error) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Ошибка при загрузке разработчиков',
            data: error
        })
    }
})
