import { defineEventHandler, setHeader } from 'h3'
import { fetchAllResults } from '../utils/fetchAllResults'

interface RawgTag {
    id: number
    name: string
    slug: string
    games_count: number
}

interface RawgTagsResponse {
    results: RawgTag[]
    count: number
}

// Кеш для тегов (меняются редко)
let tagsCache: { data: any; timestamp: number } | null = null
const TAGS_CACHE_TTL = 3600 * 1000 // 1 час

export default defineEventHandler(async (event) => {
    try {
        // Проверяем кеш
        if (tagsCache && Date.now() - tagsCache.timestamp < TAGS_CACHE_TTL) {
            setHeader(event, 'X-Cache', 'HIT')
            setHeader(event, 'Cache-Control', 'public, max-age=3600, s-maxage=3600')
            return tagsCache.data
        }
        
        setHeader(event, 'X-Cache', 'MISS')
        setHeader(event, 'Cache-Control', 'public, max-age=3600, s-maxage=3600')
        
        // Получаем все теги через пагинацию
        const allTags = await fetchAllResults<RawgTag>('/tags', {}, 40)

        // Исключаем теги, связанные с сексуальным контентом
        const sexualContentKeywords = [
            'sexual', 'nudity', 'nude', 'adult', 'sex', 'erotic', 
            'pornographic', 'explicit-sexual', 'sexual-content'
        ]

        const result = {
            results: allTags
                .filter(t => {
                    const slug = (t.slug || '').toLowerCase()
                    const name = (t.name || '').toLowerCase()
                    return t.games_count > 0 && 
                           !sexualContentKeywords.some(keyword => 
                               slug.includes(keyword) || name.includes(keyword)
                           )
                })
                .map((t) => ({
                    id: t.id,
                    name: t.name,
                    slug: t.slug,
                    gamesCount: t.games_count
                }))
                .sort((a, b) => b.gamesCount - a.gamesCount)
        }
        
        // Сохраняем в кеш
        tagsCache = {
            data: result,
            timestamp: Date.now()
        }
        
        return result
    } catch (error) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Ошибка при загрузке тегов',
            data: error
        })
    }
})
