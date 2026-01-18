import { fetchAllResults } from '../utils/fetchAllResults'

interface RawgPlatform {
    id: number
    name: string
    slug: string
}

interface RawgPlatformsResponse {
    results: RawgPlatform[]
}

// Используем defineCachedEventHandler для кеширования на Vercel
// TTL: 3600 секунд (1 час) - фильтры меняются редко
export default defineCachedEventHandler(async (event) => {
    try {
        // Получаем платформы через пагинацию (максимум 2 страницы = 80 элементов)
        const allPlatforms = await fetchAllResults<RawgPlatform>('/platforms', {}, 40, 2)

        const result = {
            results: allPlatforms.map((p) => ({
                id: p.id,
                name: p.name,
                slug: p.slug
            }))
        }
        
        return result
    } catch (error) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Ошибка при загрузке платформ',
            data: error
        })
    }
}, {
    maxAge: 3600, // 1 час
    getKey: () => 'platforms'
})
