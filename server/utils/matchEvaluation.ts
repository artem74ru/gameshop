/**
 * Система оценки качества сопоставления игр между RAWG и CheapShark
 * Метрики: Precision, Recall, F1
 */

export interface MatchEvaluationResult {
    strategy: 'exact' | 'fuzzy' | 'hybrid'
    truePositives: number
    falsePositives: number
    falseNegatives: number
    precision: number
    recall: number
    f1: number
    totalGames: number
    matchedGames: number
    unmatchedGames: number
}

export interface TestDataset {
    rawgTitle: string
    rawgReleased: string | null
    rawgPlatforms: string[]
    expectedCheapSharkGameId?: string | null  // null если соответствия нет
    expectedCheapSharkTitle?: string | null
}

/**
 * Вычисляет метрики качества сопоставления
 */
export const calculateMetrics = (
    truePositives: number,
    falsePositives: number,
    falseNegatives: number
): { precision: number; recall: number; f1: number } => {
    const precision = truePositives + falsePositives > 0
        ? truePositives / (truePositives + falsePositives)
        : 0
    
    const recall = truePositives + falseNegatives > 0
        ? truePositives / (truePositives + falseNegatives)
        : 0
    
    const f1 = precision + recall > 0
        ? (2 * precision * recall) / (precision + recall)
        : 0
    
    return { precision, recall, f1 }
}

/**
 * Оценивает качество сопоставления для одной стратегии
 */
export const evaluateStrategy = (
    strategy: 'exact' | 'fuzzy' | 'hybrid',
    testDataset: TestDataset[],
    matchResults: Array<{
        rawgTitle: string
        matched: boolean
        matchedGameId?: string | null
        matchedTitle?: string | null
        score?: number
    }>
): MatchEvaluationResult => {
    let truePositives = 0
    let falsePositives = 0
    let falseNegatives = 0
    
    // Создаем мапу для быстрого поиска ожидаемых результатов
    const expectedMap = new Map<string, { gameId: string | null; title: string | null }>()
    testDataset.forEach(item => {
        expectedMap.set(item.rawgTitle, {
            gameId: item.expectedCheapSharkGameId ?? null,
            title: item.expectedCheapSharkTitle ?? null
        })
    })
    
    // Создаем мапу для быстрого поиска фактических результатов
    const actualMap = new Map<string, { gameId: string | null; title: string | null }>()
    matchResults.forEach(result => {
        actualMap.set(result.rawgTitle, {
            gameId: result.matchedGameId ?? null,
            title: result.matchedTitle ?? null
        })
    })
    
    // Подсчитываем метрики
    for (const item of testDataset) {
        const expected = expectedMap.get(item.rawgTitle)
        const actual = actualMap.get(item.rawgTitle)
        
        if (!expected || !actual) continue
        
        const expectedHasMatch = expected.gameId !== null && expected.gameId !== undefined
        const actualHasMatch = actual.gameId !== null && actual.gameId !== undefined
        
        if (expectedHasMatch && actualHasMatch) {
            // Оба нашли совпадение - проверяем правильность
            if (expected.gameId === actual.gameId) {
                truePositives++
            } else {
                // Нашли, но не ту игру
                falsePositives++
                falseNegatives++
            }
        } else if (expectedHasMatch && !actualHasMatch) {
            // Ожидали найти, но не нашли
            falseNegatives++
        } else if (!expectedHasMatch && actualHasMatch) {
            // Не ожидали найти, но нашли (ложное срабатывание)
            falsePositives++
        }
        // else: оба не нашли - это правильно, не считаем
    }
    
    const { precision, recall, f1 } = calculateMetrics(truePositives, falsePositives, falseNegatives)
    
    const matchedGames = matchResults.filter(r => r.matched).length
    const unmatchedGames = matchResults.length - matchedGames
    
    return {
        strategy,
        truePositives,
        falsePositives,
        falseNegatives,
        precision,
        recall,
        f1,
        totalGames: testDataset.length,
        matchedGames,
        unmatchedGames
    }
}

/**
 * Сравнивает результаты всех трех стратегий
 */
export const compareStrategies = (
    exactResults: MatchEvaluationResult,
    fuzzyResults: MatchEvaluationResult,
    hybridResults: MatchEvaluationResult
): {
    bestF1: { strategy: string; value: number }
    bestPrecision: { strategy: string; value: number }
    bestRecall: { strategy: string; value: number }
    summary: Array<{
        strategy: string
        precision: number
        recall: number
        f1: number
    }>
} => {
    const results = [
        { strategy: 'exact', ...exactResults },
        { strategy: 'fuzzy', ...fuzzyResults },
        { strategy: 'hybrid', ...hybridResults }
    ]
    
    const bestF1 = results.reduce((best, current) => 
        current.f1 > best.f1 ? { strategy: current.strategy, value: current.f1 } : best,
        { strategy: 'exact', value: exactResults.f1 }
    )
    
    const bestPrecision = results.reduce((best, current) => 
        current.precision > best.precision ? { strategy: current.strategy, value: current.precision } : best,
        { strategy: 'exact', value: exactResults.precision }
    )
    
    const bestRecall = results.reduce((best, current) => 
        current.recall > best.recall ? { strategy: current.strategy, value: current.recall } : best,
        { strategy: 'exact', value: exactResults.recall }
    )
    
    const summary = results.map(r => ({
        strategy: r.strategy,
        precision: r.precision,
        recall: r.recall,
        f1: r.f1
    }))
    
    return {
        bestF1,
        bestPrecision,
        bestRecall,
        summary
    }
}
