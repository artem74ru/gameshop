/**
 * API эндпоинт для получения метрик производительности
 * Используется для сравнения пагинации vs infinite scroll и кеширования
 */
import { defineEventHandler, getQuery } from 'h3'
import { getMetrics, aggregateMetrics, compareMetrics, cleanupOldMetrics } from '../../utils/performanceMetrics'

export default defineEventHandler(async (event) => {
    try {
        cleanupOldMetrics()
        
        const query = getQuery(event)
        const sessionId = query.sessionId as string | undefined
        const mode = query.mode as 'pagination' | 'infinite' | 'compare' | undefined
        
        if (!sessionId) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Необходимо указать sessionId'
            })
        }
        
        const metrics = getMetrics(sessionId)
        
        if (metrics.length === 0) {
            return {
                message: 'Метрики не найдены для данной сессии',
                sessionId,
                metrics: []
            }
        }
        
        // Фильтруем по режиму, если указан
        const filteredMetrics = mode && mode !== 'compare'
            ? metrics.filter(m => (m as any).mode === mode)
            : metrics
        
        if (mode === 'compare') {
            // Сравниваем оба режима
            const paginationMetrics = metrics.filter(m => (m as any).mode === 'pagination')
            const infiniteMetrics = metrics.filter(m => (m as any).mode === 'infinite')
            
            if (paginationMetrics.length === 0 || infiniteMetrics.length === 0) {
                return {
                    message: 'Недостаточно данных для сравнения',
                    sessionId,
                    pagination: { count: paginationMetrics.length },
                    infinite: { count: infiniteMetrics.length }
                }
            }
            
            const comparison = compareMetrics(paginationMetrics, infiniteMetrics)
            
            return {
                sessionId,
                comparison,
                summary: {
                    pagination: {
                        averageRequests: comparison.pagination.average.requestCount.toFixed(2),
                        averageDataSize: (comparison.pagination.average.totalDataSize / 1024).toFixed(2) + ' KB',
                        averageResponseTime: comparison.pagination.average.averageResponseTime.toFixed(2) + ' ms',
                        cacheHitRate: comparison.pagination.average.cacheHitRate.toFixed(2) + '%'
                    },
                    infinite: {
                        averageRequests: comparison.infinite.average.requestCount.toFixed(2),
                        averageDataSize: (comparison.infinite.average.totalDataSize / 1024).toFixed(2) + ' KB',
                        averageResponseTime: comparison.infinite.average.averageResponseTime.toFixed(2) + ' ms',
                        cacheHitRate: comparison.infinite.average.cacheHitRate.toFixed(2) + '%'
                    },
                    differences: {
                        requestCount: comparison.differences.requestCount.toFixed(2),
                        totalDataSize: (comparison.differences.totalDataSize / 1024).toFixed(2) + ' KB',
                        averageResponseTime: comparison.differences.averageResponseTime.toFixed(2) + ' ms',
                        cacheHitRate: comparison.differences.cacheHitRate.toFixed(2) + '%'
                    }
                }
            }
        }
        
        const aggregated = aggregateMetrics(filteredMetrics)
        
        return {
            sessionId,
            mode: mode || 'all',
            metrics: filteredMetrics,
            aggregated,
            summary: {
                totalRequests: aggregated.total.requestCount,
                totalDataSize: (aggregated.total.totalDataSize / 1024).toFixed(2) + ' KB',
                averageResponseTime: aggregated.average.averageResponseTime.toFixed(2) + ' ms',
                cacheHitRate: aggregated.average.cacheHitRate.toFixed(2) + '%',
                externalApiRequests: aggregated.total.externalApiRequests,
                externalApiErrors: aggregated.total.externalApiErrors
            }
        }
    } catch (error: any) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Ошибка при получении метрик',
            data: error
        })
    }
})
