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

// Используем defineCachedEventHandler для кеширования на Vercel
// TTL: 3600 секунд (1 час) - фильтры меняются редко
export default defineCachedEventHandler(async (event) => {
    try {
        // Получаем разработчиков через пагинацию (максимум 2 страницы = 80 элементов)
        const allDevelopers = await fetchAllResults<RawgDeveloper>('/developers', {}, 40, 2)

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
        
        return result
    } catch (error) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Ошибка при загрузке разработчиков',
            data: error
        })
    }
}, {
    maxAge: 3600, // 1 час
    getKey: () => 'developers'
})
