/**
 * API эндпоинт для тестирования стратегий сопоставления
 * Принимает датасет игр и возвращает метрики для всех трех стратегий
 */
import { defineEventHandler, readBody } from 'h3'
import { getPriceFromCheapShark } from '../../utils/priceEnrichment'
import { evaluateStrategy, compareStrategies, type TestDataset } from '../../utils/matchEvaluation'

export default defineEventHandler(async (event) => {
    try {
        const body = await readBody(event)
        const testDataset: TestDataset[] = body.dataset || []
        
        if (!Array.isArray(testDataset) || testDataset.length === 0) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Необходимо предоставить массив игр для тестирования'
            })
        }
        
        console.log(`[Match Test] Начинаем тестирование на ${testDataset.length} играх`)
        
        // Тестируем каждую стратегию
        const strategies: Array<'exact' | 'fuzzy' | 'hybrid'> = ['exact', 'fuzzy', 'hybrid']
        const strategyResults: Array<{
            strategy: 'exact' | 'fuzzy' | 'hybrid'
            results: Array<{
                rawgTitle: string
                matched: boolean
                matchedGameId?: string | null
                matchedTitle?: string | null
                score?: number
            }>
        }> = []
        
        for (const strategy of strategies) {
            console.log(`[Match Test] Тестируем стратегию: ${strategy}`)
            const results = []
            
            for (const item of testDataset) {
                try {
                    const hasPCPlatform = item.rawgPlatforms.some(p => 
                        p.toLowerCase().includes('pc') || 
                        p.toLowerCase().includes('windows') ||
                        p.toLowerCase().includes('linux') ||
                        p.toLowerCase().includes('mac')
                    )
                    
                    const priceInfo = await getPriceFromCheapShark(
                        item.rawgTitle,
                        item.rawgReleased,
                        hasPCPlatform,
                        strategy
                    )
                    
                    // Извлекаем gameID из stores (если есть)
                    let matchedGameId: string | null = null
                    let matchedTitle: string | null = null
                    
                    if (priceInfo && priceInfo.stores && priceInfo.stores.length > 0) {
                        // Пытаемся найти gameID из URL или других источников
                        // В CheapShark gameID обычно не возвращается напрямую в deals
                        // Нужно будет доработать логику получения gameID
                        matchedTitle = priceInfo.storeName || null
                    }
                    
                    results.push({
                        rawgTitle: item.rawgTitle,
                        matched: priceInfo !== null,
                        matchedGameId: matchedGameId,
                        matchedTitle: matchedTitle,
                        score: priceInfo?.matchScore
                    })
                } catch (error) {
                    console.error(`[Match Test] Ошибка для "${item.rawgTitle}":`, error)
                    results.push({
                        rawgTitle: item.rawgTitle,
                        matched: false,
                        matchedGameId: null,
                        matchedTitle: null,
                        score: 0
                    })
                }
                
                // Небольшая задержка между запросами
                await new Promise(resolve => setTimeout(resolve, 100))
            }
            
            strategyResults.push({ strategy, results })
        }
        
        // Вычисляем метрики для каждой стратегии
        const exactEvaluation = evaluateStrategy('exact', testDataset, strategyResults[0].results)
        const fuzzyEvaluation = evaluateStrategy('fuzzy', testDataset, strategyResults[1].results)
        const hybridEvaluation = evaluateStrategy('hybrid', testDataset, strategyResults[2].results)
        
        // Сравниваем стратегии
        const comparison = compareStrategies(exactEvaluation, fuzzyEvaluation, hybridEvaluation)
        
        return {
            evaluations: {
                exact: exactEvaluation,
                fuzzy: fuzzyEvaluation,
                hybrid: hybridEvaluation
            },
            comparison,
            rawResults: strategyResults
        }
    } catch (error: any) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Ошибка при тестировании стратегий',
            data: error
        })
    }
})
