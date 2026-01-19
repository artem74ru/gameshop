export const useRawgClient = () => {
    const config = useRuntimeConfig()

    if (!config.rawgApiKey || !config.rawgBaseUrl) {
        throw createError({
            statusCode: 500,
            statusMessage: 'RAWG API не настроен. Проверьте переменные окружения RAWG_API_KEY и RAWG_BASE_URL'
        })
    }

    const get = async <T = unknown>(
        path: string, 
        params: Record<string, string | number | undefined> = {},
        options: { retries?: number; timeout?: number } = {}
    ): Promise<T> => {
        const maxRetries = options.retries ?? 2
        const timeout = options.timeout ?? 15000 // 15 секунд по умолчанию
        let retryCount = 0

        while (retryCount <= maxRetries) {
            try {
                const url = new URL(config.rawgBaseUrl + path)
                url.searchParams.set('key', config.rawgApiKey)
                
                Object.entries(params).forEach(([key, value]) => {
                    if (value !== undefined && value !== null && value !== '') {
                        url.searchParams.set(key, String(value))
                    }
                })

                // Увеличиваем таймаут для внешних API запросов (15 секунд)
                const response = await $fetch(url.toString(), {
                    timeout: timeout
                })
                return response as T
            } catch (error: any) {
                const isTimeout = error.name === 'AbortError' || 
                                 error.message?.includes('timeout') || 
                                 error.message?.includes('Timeout') ||
                                 error.cause?.code === 23 // TimeoutError code
                
                // Если это таймаут и есть попытки, повторяем с экспоненциальной задержкой
                if (isTimeout && retryCount < maxRetries) {
                    retryCount++
                    const delay = Math.min(3000, Math.pow(2, retryCount) * 500) // Экспоненциальная задержка: 1s, 2s, макс 3s
                    console.warn(`[RAWG] Таймаут запроса к ${path}, повтор через ${delay}мс (попытка ${retryCount}/${maxRetries})`)
                    await new Promise(resolve => setTimeout(resolve, delay))
                    continue
                }
                
                // Если это таймаут и попытки закончились, возвращаем ошибку
                if (isTimeout) {
                    throw createError({
                        statusCode: 504,
                        message: `Таймаут запроса к RAWG API: ${path} (после ${maxRetries} попыток)`,
                        statusMessage: `Таймаут запроса к RAWG API: ${path}`,
                        data: error
                    })
                }
                
                // Другие ошибки - выбрасываем сразу
                throw createError({
                    statusCode: error.statusCode || 500,
                    message: `Ошибка запроса к RAWG API: ${path}`,
                    statusMessage: `Ошибка запроса к RAWG API: ${path}`,
                    data: error
                })
            }
        }

        // Этот код не должен выполниться, но TypeScript требует возврат
        throw createError({
            statusCode: 500,
            message: `Неожиданная ошибка в RAWG клиенте: ${path}`,
            statusMessage: `Неожиданная ошибка в RAWG клиенте: ${path}`
        })
    }

    return { get }
}
