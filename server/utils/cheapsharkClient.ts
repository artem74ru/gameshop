export const useCheapSharkClient = () => {
    const baseUrl = 'https://www.cheapshark.com/api/1.0'

    const get = async <T = unknown>(path: string, params: Record<string, string | number | undefined> = {}): Promise<T> => {
        const url = new URL(baseUrl + path)
        
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                url.searchParams.set(key, String(value))
            }
        })

        try {
            const response = await $fetch<T>(url.toString(), {
                onResponseError({ response }) {
                    // Обрабатываем 429 ошибку и извлекаем Retry-After заголовок
                    if (response.status === 429) {
                        let retryAfter: string | number | undefined
                        
                        // Пробуем разные способы получить заголовок
                        if (response.headers) {
                            if (typeof response.headers.get === 'function') {
                                retryAfter = response.headers.get('retry-after')
                            } else if (response.headers['retry-after']) {
                                retryAfter = response.headers['retry-after']
                            } else if (response.headers['Retry-After']) {
                                retryAfter = response.headers['Retry-After']
                            }
                        }
                        
                        if (retryAfter) {
                            const retryAfterSeconds = parseInt(String(retryAfter), 10)
                            if (!isNaN(retryAfterSeconds)) {
                                // Сохраняем в response для доступа в catch блоке
                                ;(response as any).retryAfter = retryAfterSeconds
                            }
                        }
                    }
                }
            })
            return response
        } catch (error: any) {
            // Извлекаем Retry-After из заголовков ответа, если доступно
            if (error?.response?.status === 429 || error?.status === 429 || error?.statusCode === 429) {
                let retryAfter: string | number | undefined = error?.response?.retryAfter
                
                if (!retryAfter && error?.response?.headers) {
                    const headers = error.response.headers
                    if (typeof headers.get === 'function') {
                        retryAfter = headers.get('retry-after')
                    } else if (headers['retry-after']) {
                        retryAfter = headers['retry-after']
                    } else if (headers['Retry-After']) {
                        retryAfter = headers['Retry-After']
                    }
                }
                
                if (retryAfter) {
                    const retryAfterSeconds = parseInt(String(retryAfter), 10)
                    if (!isNaN(retryAfterSeconds)) {
                        error.retryAfter = retryAfterSeconds
                    }
                }
            }
            console.error(`Ошибка запроса к CheapShark API: ${path}`, error)
            throw error
        }
    }

    return { get }
}

