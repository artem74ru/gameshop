/**
 * Система сбора метрик производительности
 * Для сравнения пагинации vs infinite scroll и кеширования
 */

export interface PerformanceMetrics {
    // Lighthouse метрики
    ttfb?: number // Time to First Byte
    lcp?: number // Largest Contentful Paint
    cls?: number // Cumulative Layout Shift
    
    // Сетевые метрики
    requestCount: number // Количество запросов к server routes
    totalDataSize: number // Суммарный объем данных (байты)
    averageResponseTime: number // Среднее время ответа API (мс)
    
    // Метрики кеширования
    cacheHits: number
    cacheMisses: number
    cacheHitRate: number // Процент попаданий в кеш
    
    // Метрики внешних API
    externalApiRequests: number // Количество запросов к RAWG/CheapShark
    externalApiErrors: number // Количество ошибок внешних API
    
    // Временные метрики
    timestamp: number
    sessionId?: string
}

// Хранилище метрик (в памяти, для демонстрации)
const metricsStore = new Map<string, PerformanceMetrics[]>()

/**
 * Сохранение метрик для сессии
 */
export const saveMetrics = (sessionId: string, metrics: PerformanceMetrics) => {
    if (!metricsStore.has(sessionId)) {
        metricsStore.set(sessionId, [])
    }
    metricsStore.get(sessionId)!.push({
        ...metrics,
        timestamp: Date.now()
    })
}

/**
 * Получение метрик для сессии
 */
export const getMetrics = (sessionId: string): PerformanceMetrics[] => {
    return metricsStore.get(sessionId) || []
}

/**
 * Агрегация метрик для сравнения
 */
export const aggregateMetrics = (metrics: PerformanceMetrics[]): {
    average: PerformanceMetrics
    total: PerformanceMetrics
    count: number
} => {
    if (metrics.length === 0) {
        return {
            average: {
                requestCount: 0,
                totalDataSize: 0,
                averageResponseTime: 0,
                cacheHits: 0,
                cacheMisses: 0,
                cacheHitRate: 0,
                externalApiRequests: 0,
                externalApiErrors: 0,
                timestamp: Date.now()
            },
            total: {
                requestCount: 0,
                totalDataSize: 0,
                averageResponseTime: 0,
                cacheHits: 0,
                cacheMisses: 0,
                cacheHitRate: 0,
                externalApiRequests: 0,
                externalApiErrors: 0,
                timestamp: Date.now()
            },
            count: 0
        }
    }
    
    const total = metrics.reduce((acc, m) => ({
        requestCount: acc.requestCount + m.requestCount,
        totalDataSize: acc.totalDataSize + m.totalDataSize,
        averageResponseTime: acc.averageResponseTime + m.averageResponseTime,
        cacheHits: acc.cacheHits + m.cacheHits,
        cacheMisses: acc.cacheMisses + m.cacheMisses,
        cacheHitRate: 0, // Вычислим отдельно
        externalApiRequests: acc.externalApiRequests + m.externalApiRequests,
        externalApiErrors: acc.externalApiErrors + m.externalApiErrors,
        timestamp: Date.now()
    }), {
        requestCount: 0,
        totalDataSize: 0,
        averageResponseTime: 0,
        cacheHits: 0,
        cacheMisses: 0,
        cacheHitRate: 0,
        externalApiRequests: 0,
        externalApiErrors: 0,
        timestamp: Date.now()
    })
    
    const count = metrics.length
    const totalCacheRequests = total.cacheHits + total.cacheMisses
    
    return {
        average: {
            requestCount: total.requestCount / count,
            totalDataSize: total.totalDataSize / count,
            averageResponseTime: total.averageResponseTime / count,
            cacheHits: total.cacheHits / count,
            cacheMisses: total.cacheMisses / count,
            cacheHitRate: totalCacheRequests > 0 ? (total.cacheHits / totalCacheRequests) * 100 : 0,
            externalApiRequests: total.externalApiRequests / count,
            externalApiErrors: total.externalApiErrors / count,
            timestamp: Date.now()
        },
        total: {
            ...total,
            cacheHitRate: totalCacheRequests > 0 ? (total.cacheHits / totalCacheRequests) * 100 : 0
        },
        count
    }
}

/**
 * Сравнение метрик двух режимов
 */
export const compareMetrics = (
    paginationMetrics: PerformanceMetrics[],
    infiniteMetrics: PerformanceMetrics[]
): {
    pagination: ReturnType<typeof aggregateMetrics>
    infinite: ReturnType<typeof aggregateMetrics>
    differences: {
        requestCount: number
        totalDataSize: number
        averageResponseTime: number
        cacheHitRate: number
    }
} => {
    const pagination = aggregateMetrics(paginationMetrics)
    const infinite = aggregateMetrics(infiniteMetrics)
    
    return {
        pagination,
        infinite,
        differences: {
            requestCount: infinite.average.requestCount - pagination.average.requestCount,
            totalDataSize: infinite.average.totalDataSize - pagination.average.totalDataSize,
            averageResponseTime: infinite.average.averageResponseTime - pagination.average.averageResponseTime,
            cacheHitRate: infinite.average.cacheHitRate - pagination.average.cacheHitRate
        }
    }
}

/**
 * Очистка старых метрик (старше 24 часов)
 */
export const cleanupOldMetrics = () => {
    const now = Date.now()
    const maxAge = 24 * 60 * 60 * 1000 // 24 часа
    
    for (const [sessionId, metrics] of metricsStore.entries()) {
        const filtered = metrics.filter(m => now - m.timestamp < maxAge)
        if (filtered.length === 0) {
            metricsStore.delete(sessionId)
        } else {
            metricsStore.set(sessionId, filtered)
        }
    }
}
