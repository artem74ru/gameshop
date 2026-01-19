/**
 * Rate Limiter для CheapShark API
 * Ограничивает количество запросов для защиты от блокировок
 */
class CheapSharkRateLimiter {
    private requestTimes: number[] = []
    private readonly maxRequestsPerMinute = 10 // Максимум 10 запросов в минуту
    private readonly minDelayBetweenRequests = 6000 // Минимум 6 секунд между запросами
    private isBlocked = false
    private blockUntil: number | null = null

    /**
     * Проверяет, можно ли сделать запрос
     */
    async waitIfNeeded(): Promise<void> {
        const now = Date.now()

        // Проверяем, не заблокирован ли API
        if (this.isBlocked && this.blockUntil && now < this.blockUntil) {
            const waitTime = this.blockUntil - now
            console.log(`[CheapShark] API заблокирован, ждем ${Math.ceil(waitTime / 1000)} секунд`)
            await this.sleep(waitTime)
            this.isBlocked = false
            this.blockUntil = null
        }

        // Удаляем старые записи (старше 1 минуты)
        this.requestTimes = this.requestTimes.filter(time => now - time < 60000)

        // Если достигнут лимит запросов, ждем
        if (this.requestTimes.length >= this.maxRequestsPerMinute) {
            const oldestRequest = this.requestTimes[0]
            const waitTime = 60000 - (now - oldestRequest) + 1000 // +1 секунда для безопасности
            if (waitTime > 0) {
                console.log(`[CheapShark] Достигнут лимит запросов, ждем ${Math.ceil(waitTime / 1000)} секунд`)
                await this.sleep(waitTime)
                // Удаляем старые записи после ожидания
                this.requestTimes = this.requestTimes.filter(time => Date.now() - time < 60000)
            }
        }

        // Проверяем минимальную задержку между запросами
        if (this.requestTimes.length > 0) {
            const lastRequest = this.requestTimes[this.requestTimes.length - 1]
            const timeSinceLastRequest = now - lastRequest
            if (timeSinceLastRequest < this.minDelayBetweenRequests) {
                const waitTime = this.minDelayBetweenRequests - timeSinceLastRequest
                await this.sleep(waitTime)
            }
        }

        // Регистрируем новый запрос
        this.requestTimes.push(Date.now())
    }

    /**
     * Устанавливает блокировку API на указанное время
     */
    setBlock(retryAfterSeconds: number): void {
        this.isBlocked = true
        this.blockUntil = Date.now() + (retryAfterSeconds * 1000)
        console.log(`[CheapShark] API заблокирован на ${retryAfterSeconds} секунд`)
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms))
    }
}

// Глобальный экземпляр rate limiter
const rateLimiter = new CheapSharkRateLimiter()

export const useCheapSharkClient = () => {
    const baseUrl = 'https://www.cheapshark.com/api/1.0'

    const get = async <T = unknown>(path: string, params: Record<string, string | number | undefined> = {}): Promise<T> => {
        const url = new URL(baseUrl + path)
        
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                url.searchParams.set(key, String(value))
            }
        })

        // Ждем, если нужно (rate limiting)
        await rateLimiter.waitIfNeeded()

        let retryCount = 0
        const maxRetries = 2

        while (retryCount <= maxRetries) {
            try {
                const response = await $fetch<T>(url.toString(), {
                    timeout: 10000, // 10 секунд таймаут
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
                            
                            // Устанавливаем блокировку в rate limiter
                            rateLimiter.setBlock(retryAfterSeconds)
                            
                            // Если это последняя попытка, ждем и пробуем еще раз
                            if (retryCount < maxRetries) {
                                console.log(`[CheapShark] Получен 429, ждем ${retryAfterSeconds} секунд перед повтором`)
                                await new Promise(resolve => setTimeout(resolve, retryAfterSeconds * 1000))
                                retryCount++
                                continue // Пробуем еще раз
                            }
                        }
                    } else {
                        // Если Retry-After не указан, используем экспоненциальную задержку
                        const delay = Math.min(60000, Math.pow(2, retryCount) * 1000) // Максимум 60 секунд
                        if (retryCount < maxRetries) {
                            console.log(`[CheapShark] Получен 429 без Retry-After, ждем ${delay / 1000} секунд`)
                            await new Promise(resolve => setTimeout(resolve, delay))
                            retryCount++
                            continue
                        }
                    }
                }
                
                // Если это не 429 или превышено количество попыток, выбрасываем ошибку
                console.error(`[CheapShark] Ошибка запроса к API: ${path}`, error)
                throw error
            }
        }

        // Этот код не должен выполниться, но TypeScript требует возврат
        throw new Error('Unexpected error in CheapShark client')
    }

    return { get }
}

