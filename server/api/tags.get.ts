import { defineCachedEventHandler } from 'h3'
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

// Используем defineCachedEventHandler для кеширования на Vercel
// TTL: 3600 секунд (1 час) - фильтры меняются редко
export default defineCachedEventHandler(async (event) => {
    try {
        // Получаем теги через пагинацию (максимум 2 страницы = 80 элементов)
        const allTags = await fetchAllResults<RawgTag>('/tags', {}, 40, 2)

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
        
        return result
    } catch (error) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Ошибка при загрузке тегов',
            data: error
        })
    }
}, {
    maxAge: 3600, // 1 час
    getKey: () => 'tags'
})
