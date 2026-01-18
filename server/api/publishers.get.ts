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

// Используем defineCachedEventHandler для кеширования на Vercel
// TTL: 3600 секунд (1 час) - фильтры меняются редко
export default defineCachedEventHandler(async (event) => {
    try {
        // Получаем издателей через пагинацию (максимум 2 страницы = 80 элементов)
        const allPublishers = await fetchAllResults<RawgPublisher>('/publishers', {}, 40, 2)

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
        
        return result
    } catch (error) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Ошибка при загрузке издателей',
            data: error
        })
    }
}, {
    maxAge: 3600, // 1 час
    getKey: () => 'publishers'
})
