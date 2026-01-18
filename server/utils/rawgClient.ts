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

            const response = await $fetch(url.toString())
            return response as T
        } catch (error) {
            throw createError({
                statusCode: 500,
                statusMessage: `Ошибка запроса к RAWG API: ${path}`,
                data: error
            })
        }
    }

    return { get }
}
