/**
 * Утилита для получения всех результатов из RAWG API через пагинацию
 */
import { useRawgClient } from './rawgClient'

interface PaginatedResponse<T> {
    results: T[]
    count: number
    next?: string | null
    previous?: string | null
}

/**
 * Получает все результаты из RAWG API через пагинацию
 * @param endpoint - эндпоинт API (например, '/genres', '/publishers')
 * @param params - дополнительные параметры запроса
 * @param maxPageSize - максимальный размер страницы (обычно 40-50 для RAWG API)
 * @returns массив всех результатов
 */
export const fetchAllResults = async <T = any>(
    endpoint: string,
    params: Record<string, string | number | undefined> = {},
    maxPageSize: number = 40
): Promise<T[]> => {
    const { get } = useRawgClient()
    const allResults: T[] = []
    let page = 1
    let hasMore = true

    while (hasMore) {
        try {
            const response = await get<PaginatedResponse<T>>(endpoint, {
                ...params,
                page,
                page_size: maxPageSize
            })

            if (response.results && response.results.length > 0) {
                allResults.push(...response.results)
            }

            // Проверяем, есть ли следующая страница
            // RAWG API возвращает next: null когда страниц больше нет
            // Если количество результатов меньше page_size, значит это последняя страница
            if (response.next !== null && response.next !== undefined && response.results.length === maxPageSize) {
                page++
            } else {
                hasMore = false
            }
        } catch (error) {
            console.error(`Ошибка при получении страницы ${page} для ${endpoint}:`, error)
            // Если ошибка, прекращаем пагинацию
            hasMore = false
        }
    }

    return allResults
}
