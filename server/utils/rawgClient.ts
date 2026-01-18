export const useRawgClient = () => {
    const config = useRuntimeConfig()

    if (!config.rawgApiKey || !config.rawgBaseUrl) {
        throw createError({
            statusCode: 500,
            statusMessage: 'RAWG API не настроен. Проверьте переменные окружения RAWG_API_KEY и RAWG_BASE_URL'
        })
    }

    const get = async <T = unknown>(path: string, params: Record<string, string | number | undefined> = {}): Promise<T> => {
        try {
            const url = new URL(config.rawgBaseUrl + path)
            url.searchParams.set('key', config.rawgApiKey)
            
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    url.searchParams.set(key, String(value))
                }
            })

            // Добавляем таймаут для внешних API запросов (5 секунд)
            const response = await $fetch(url.toString(), {
                timeout: 5000 // 5 секунд таймаут
            })
            return response as T
        } catch (error: any) {
            // Если это таймаут, возвращаем более понятную ошибку
            if (error.name === 'AbortError' || error.message?.includes('timeout')) {
                throw createError({
                    statusCode: 504,
                    statusMessage: `Таймаут запроса к RAWG API: ${path}`,
                    data: error
                })
            }
            throw createError({
                statusCode: 500,
                statusMessage: `Ошибка запроса к RAWG API: ${path}`,
                data: error
            })
        }
    }

    return { get }
}
