import { fetchAllResults } from '../utils/fetchAllResults'

interface RawgGenre {
    id: number
    name: string
    slug: string
    games_count: number
}

interface RawgGenresResponse {
    results: RawgGenre[]
    count: number
}

// Используем defineCachedEventHandler для кеширования на Vercel
// TTL: 3600 секунд (1 час) - фильтры меняются редко
export default defineCachedEventHandler(async (event) => {
    try {
        // Получаем жанры через пагинацию (максимум 2 страницы = 80 элементов)
        const allGenres = await fetchAllResults<RawgGenre>('/genres', {}, 40, 2)

        const result = {
            results: allGenres
                .filter(g => g.games_count > 0)
                .map((g) => ({
                    id: g.id,
                    name: g.name,
                    slug: g.slug,
                    gamesCount: g.games_count
                }))
                .sort((a, b) => b.gamesCount - a.gamesCount)
        }
        
        return result
    } catch (error) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Ошибка при загрузке жанров',
            data: error
        })
    }
}, {
    maxAge: 3600, // 1 час
    getKey: () => 'genres'
})

