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
    maxPageSize: number = 40,
    maxPages: number = 5 // Ограничиваем количество страниц для избежания таймаутов
): Promise<T[]> => {
    const { get } = useRawgClient()
    const allResults: T[] = []
    let page = 1
    let hasMore = true
    const startTime = Date.now()
    const MAX_EXECUTION_TIME = 8000 // Максимум 8 секунд на выполнение

    while (hasMore && page <= maxPages) {
        // Проверяем, не превысили ли мы максимальное время выполнения
        if (Date.now() - startTime > MAX_EXECUTION_TIME) {
            console.warn(`Превышено максимальное время выполнения для ${endpoint}, останавливаем пагинацию на странице ${page}`)
            break
        }

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
        } catch (error: any) {
            console.error(`Ошибка при получении страницы ${page} для ${endpoint}:`, error)
            // Если это таймаут, прекращаем пагинацию
            if (error.statusCode === 504 || error.message?.includes('timeout')) {
                console.warn(`Таймаут при получении страницы ${page} для ${endpoint}, возвращаем уже полученные результаты`)
                break
            }
            // Если ошибка, прекращаем пагинацию
            hasMore = false
        }
    }

    return allResults
}
