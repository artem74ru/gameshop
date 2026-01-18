/**
 * API эндпоинт для сохранения метрик производительности
 */
import { defineEventHandler, readBody } from 'h3'
import { saveMetrics, type PerformanceMetrics } from '../../utils/performanceMetrics'

export default defineEventHandler(async (event) => {
    try {
        const body = await readBody(event)
        const metrics: PerformanceMetrics = body.metrics
        const sessionId: string = body.sessionId
        
        if (!sessionId || !metrics) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Необходимо указать sessionId и metrics'
            })
        }
        
        // Добавляем режим из body, если есть
        const mode = body.mode as 'pagination' | 'infinite' | undefined
        const metricsWithMode = {
            ...metrics,
            mode,
            sessionId
        }
        
        saveMetrics(sessionId, metricsWithMode as any)
        
        return {
            success: true,
            message: 'Метрики сохранены',
            sessionId
        }
    } catch (error: any) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Ошибка при сохранении метрик',
            data: error
        })
    }
})
