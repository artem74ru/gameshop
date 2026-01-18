/**
 * Утилиты для сопоставления игр между RAWG и CheapShark
 */

// Слова-шум для удаления при нормализации
const NOISE_WORDS = [
    'goty', 'game of the year', 'deluxe', 'definitive', 'complete', 
    'edition', 'remastered', 'remaster', 'bundle', 'pack', 'dlc',
    'add-on', 'addon', 'expansion', 'season pass', 'ultimate', 
    'gold', 'special', 'collector', 'premium', 'standard', 'hd',
    'enhanced', 'director\'s cut', 'extended', 'anniversary'
]

/**
 * Стратегия A: Точное сопоставление (baseline)
 * Нормализация названия и точное совпадение
 */
export const normalizeGameTitle = (title: string): string => {
    if (!title) return ''
    
    let normalized = title.toLowerCase()
        .replace(/[^\w\s]/g, '') // Удаляем знаки препинания
        .replace(/\s+/g, ' ') // Множественные пробелы в один
        .trim()
    
    // Удаляем слова-шум
    NOISE_WORDS.forEach(noise => {
        const regex = new RegExp(`\\b${noise}\\b`, 'gi')
        normalized = normalized.replace(regex, '')
    })
    
    return normalized.replace(/\s+/g, ' ').trim()
}

export const exactMatch = (rawgTitle: string, cheapSharkTitle: string): boolean => {
    const normalizedRawg = normalizeGameTitle(rawgTitle)
    const normalizedCheapShark = normalizeGameTitle(cheapSharkTitle)
    return normalizedRawg === normalizedCheapShark
}

/**
 * Стратегия B: Нечёткое сопоставление (fuzzy)
 * Использует расстояние Левенштейна и схожесть токенов
 */

// Простая реализация расстояния Левенштейна
const levenshteinDistance = (str1: string, str2: string): number => {
    const len1 = str1.length
    const len2 = str2.length
    const matrix: number[][] = []

    for (let i = 0; i <= len1; i++) {
        matrix[i] = [i]
    }

    for (let j = 0; j <= len2; j++) {
        matrix[0][j] = j
    }

    for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
            if (str1[i - 1] === str2[j - 1]) {
                matrix[i][j] = matrix[i - 1][j - 1]
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j - 1] + 1
                )
            }
        }
    }

    return matrix[len1][len2]
}

// Схожесть по токенам (Jaccard similarity)
const tokenSimilarity = (str1: string, str2: string): number => {
    const tokens1 = new Set(str1.split(' ').filter(t => t.length > 2))
    const tokens2 = new Set(str2.split(' ').filter(t => t.length > 2))
    
    const intersection = new Set([...tokens1].filter(x => tokens2.has(x)))
    const union = new Set([...tokens1, ...tokens2])
    
    return union.size > 0 ? intersection.size / union.size : 0
}

export const fuzzyMatch = (rawgTitle: string, cheapSharkTitle: string, threshold: number = 0.60): { match: boolean; score: number } => {
    const normalizedRawg = normalizeGameTitle(rawgTitle)
    const normalizedCheapShark = normalizeGameTitle(cheapSharkTitle)
    
    if (normalizedRawg === normalizedCheapShark) {
        return { match: true, score: 1.0 }
    }
    
    // Расстояние Левенштейна (нормализованное)
    const maxLen = Math.max(normalizedRawg.length, normalizedCheapShark.length)
    const levenshteinDist = levenshteinDistance(normalizedRawg, normalizedCheapShark)
    const levenshteinScore = maxLen > 0 ? 1 - (levenshteinDist / maxLen) : 0
    
    // Схожесть по токенам
    const tokenScore = tokenSimilarity(normalizedRawg, normalizedCheapShark)
    
    // Комбинированный score (взвешенное среднее)
    const combinedScore = (levenshteinScore * 0.6) + (tokenScore * 0.4)
    
    return {
        match: combinedScore >= threshold,
        score: combinedScore
    }
}

/**
 * Стратегия C: Гибридное сопоставление
 * Fuzzy + штрафы/бонусы по году релиза и платформе
 */
export interface HybridMatchOptions {
    rawgTitle: string
    cheapSharkTitle: string
    rawgReleased?: string | null
    cheapSharkReleaseDate?: string | null
    hasPCPlatform?: boolean
    fuzzyThreshold?: number
}

export const hybridMatch = (options: HybridMatchOptions): { match: boolean; score: number; reason?: string } => {
    const {
        rawgTitle,
        cheapSharkTitle,
        rawgReleased,
        cheapSharkReleaseDate,
        hasPCPlatform = true,
        fuzzyThreshold = 0.55
    } = options
    
    // Базовый fuzzy score
    const fuzzyResult = fuzzyMatch(rawgTitle, cheapSharkTitle, fuzzyThreshold)
    let score = fuzzyResult.score
    
    // Бонус/штраф по году релиза
    if (rawgReleased && cheapSharkReleaseDate) {
        try {
            const rawgYear = new Date(rawgReleased).getFullYear()
            const cheapSharkYear = new Date(cheapSharkReleaseDate).getFullYear()
            const yearDiff = Math.abs(rawgYear - cheapSharkYear)
            
            if (yearDiff === 0) {
                score += 0.1 // Бонус за совпадение года
            } else if (yearDiff <= 1) {
                score += 0.05 // Небольшой бонус за близкий год
            } else if (yearDiff > 3) {
                score -= 0.2 // Штраф за большой разброс годов
            }
        } catch (e) {
            // Игнорируем ошибки парсинга дат
        }
    }
    
    // Штраф если нет PC платформы (CheapShark в основном для PC)
    if (!hasPCPlatform) {
        score -= 0.15
    }
    
    // Нормализуем score в диапазон [0, 1]
    score = Math.max(0, Math.min(1, score))
    
    return {
        match: score >= fuzzyThreshold,
        score,
        reason: score >= fuzzyThreshold ? 'hybrid_match' : 'low_score'
    }
}

/**
 * Поиск лучшего совпадения среди списка игр CheapShark
 */
export interface MatchResult {
    match: boolean
    score: number
    gameId?: string
    gameTitle?: string
    reason?: string
}

export const findBestMatch = (
    rawgTitle: string,
    rawgReleased: string | null | undefined,
    hasPCPlatform: boolean,
    cheapSharkGames: Array<{ gameID: string; title: string; releaseDate?: string }>,
    strategy: 'exact' | 'fuzzy' | 'hybrid' = 'hybrid'
): MatchResult => {
    if (cheapSharkGames.length === 0) {
        return { match: false, score: 0, reason: 'no_games' }
    }
    
    let bestMatch: MatchResult = { match: false, score: 0 }
    
    // Сначала пробуем точное совпадение
    for (const cheapSharkGame of cheapSharkGames) {
        if (exactMatch(rawgTitle, cheapSharkGame.title)) {
            return {
                match: true,
                score: 1.0,
                gameId: cheapSharkGame.gameID,
                gameTitle: cheapSharkGame.title,
                reason: 'exact'
            }
        }
    }
    
    // Если точного совпадения нет, используем выбранную стратегию
    for (const cheapSharkGame of cheapSharkGames) {
        let result: MatchResult
        
        switch (strategy) {
            case 'exact':
                // Уже проверили выше, но на всякий случай
                result = {
                    match: false,
                    score: 0,
                    gameId: cheapSharkGame.gameID,
                    gameTitle: cheapSharkGame.title,
                    reason: 'exact'
                }
                break
                
            case 'fuzzy':
                const fuzzyResult = fuzzyMatch(rawgTitle, cheapSharkGame.title)
                result = {
                    match: fuzzyResult.match,
                    score: fuzzyResult.score,
                    gameId: cheapSharkGame.gameID,
                    gameTitle: cheapSharkGame.title,
                    reason: 'fuzzy'
                }
                break
                
            case 'hybrid':
            default:
                const hybridResult = hybridMatch({
                    rawgTitle,
                    cheapSharkTitle: cheapSharkGame.title,
                    rawgReleased,
                    cheapSharkReleaseDate: cheapSharkGame.releaseDate,
                    hasPCPlatform
                })
                result = {
                    match: hybridResult.match,
                    score: hybridResult.score,
                    gameId: cheapSharkGame.gameID,
                    gameTitle: cheapSharkGame.title,
                    reason: hybridResult.reason
                }
                break
        }
        
        if (result.score > bestMatch.score) {
            bestMatch = result
        }
    }
    
    return bestMatch
}

