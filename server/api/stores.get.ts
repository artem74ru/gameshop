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

// Используем defineCachedEventHandler для кеширования на Vercel
// TTL: 3600 секунд (1 час) - фильтры меняются редко
export default defineCachedEventHandler(async (event) => {
    try {
        // Получаем магазины через пагинацию (максимум 2 страницы = 80 элементов)
        const allStores = await fetchAllResults<RawgStore>('/stores', {}, 40, 2)

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
        
        return result
    } catch (error) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Ошибка при загрузке магазинов',
            data: error
        })
    }
}, {
    maxAge: 3600, // 1 час
    getKey: () => 'stores'
})
