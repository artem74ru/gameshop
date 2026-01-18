import { defineEventHandler } from 'h3'
import { fetchAllResults } from '../utils/fetchAllResults'

interface RawgPlatform {
    id: number
    name: string
    slug: string
}

interface RawgPlatformsResponse {
    results: RawgPlatform[]
}

// Кеш для платформ (меняются редко)
let platformsCache: { data: any; timestamp: number } | null = null
const PLATFORMS_CACHE_TTL = 3600 * 1000 // 1 час

export default defineEventHandler(async (event) => {
    try {
        // Проверяем кеш
        if (platformsCache && Date.now() - platformsCache.timestamp < PLATFORMS_CACHE_TTL) {
            setHeader(event, 'X-Cache', 'HIT')
            setHeader(event, 'Cache-Control', 'public, max-age=3600, s-maxage=3600')
            return platformsCache.data
        }
        
        setHeader(event, 'X-Cache', 'MISS')
        setHeader(event, 'Cache-Control', 'public, max-age=3600, s-maxage=3600')
        
        // Получаем все платформы через пагинацию
        const allPlatforms = await fetchAllResults<RawgPlatform>('/platforms', {}, 40)

        const result = {
            results: allPlatforms.map((p) => ({
                id: p.id,
                name: p.name,
                slug: p.slug
            }))
        }
        
        // Сохраняем в кеш
        platformsCache = {
            data: result,
            timestamp: Date.now()
        }
        
        return result
    } catch (error) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Ошибка при загрузке платформ',
            data: error
        })
    }
})
