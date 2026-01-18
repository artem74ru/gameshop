import { defineEventHandler, setHeader } from 'h3'
import { fetchAllResults } from '../utils/fetchAllResults'

interface RawgStore {
    id: number
    name: string
    slug: string
    games_count: number
}

interface RawgStoresResponse {
    results: RawgStore[]
    count: number
}

// Кеш для магазинов (меняются редко)
let storesCache: { data: any; timestamp: number } | null = null
const STORES_CACHE_TTL = 3600 * 1000 // 1 час

export default defineEventHandler(async (event) => {
    try {
        // Проверяем кеш
        if (storesCache && Date.now() - storesCache.timestamp < STORES_CACHE_TTL) {
            setHeader(event, 'X-Cache', 'HIT')
            setHeader(event, 'Cache-Control', 'public, max-age=3600, s-maxage=3600')
            return storesCache.data
        }
        
        setHeader(event, 'X-Cache', 'MISS')
        setHeader(event, 'Cache-Control', 'public, max-age=3600, s-maxage=3600')
        
        // Получаем все магазины через пагинацию
        const allStores = await fetchAllResults<RawgStore>('/stores', {}, 40)

        const result = {
            results: allStores
                .filter(s => s.games_count > 0)
                .map((s) => ({
                    id: s.id,
                    name: s.name,
                    slug: s.slug,
                    gamesCount: s.games_count
                }))
                .sort((a, b) => b.gamesCount - a.gamesCount)
        }
        
        // Сохраняем в кеш
        storesCache = {
            data: result,
            timestamp: Date.now()
        }
        
        return result
    } catch (error) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Ошибка при загрузке магазинов',
            data: error
        })
    }
})
