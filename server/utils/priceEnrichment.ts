/**
 * Обогащение данных игр ценами из CheapShark
 */
import { useCheapSharkClient } from './cheapsharkClient'
import { findBestMatch, exactMatch, fuzzyMatch, hybridMatch } from './gameMatching'

// Кэш для магазинов CheapShark
let storesCache: Map<string, string> | null = null

// Кэш для цен игр (чтобы не делать повторные запросы)
const priceCache = new Map<string, { priceInfo: PriceInfo | null; timestamp: number }>()
const PRICE_CACHE_TTL = 7 * 24 * 60 * 60 * 1000 // 7 дней (увеличено для защиты от блокировок)

// Флаг блокировки API
let isApiBlocked = false
let blockUntil: number | null = null
const BLOCK_DURATION = 60 * 60 * 1000 // 1 час блокировки

// Отключение реальных запросов к CheapShark (для локальной разработки или CI)
const isCheapSharkDisabled = process.env.DISABLE_CHEAPSHARK === '1'

/**
 * Получение списка магазинов CheapShark с кэшированием
 */
const getCheapSharkStores = async (): Promise<Map<string, string>> => {
    if (storesCache) {
        return storesCache
    }
    
    try {
        const { get } = useCheapSharkClient()
        const stores = await get<CheapSharkStore[]>('/stores') as CheapSharkStore[]
        storesCache = new Map()
        stores.forEach(store => {
            storesCache!.set(store.storeID, store.storeName)
        })
        return storesCache
    } catch (error) {
        console.error('Ошибка при получении списка магазинов CheapShark:', error)
        return new Map()
    }
}

export interface CheapSharkStore {
    storeID: string
    storeName: string
}

export interface CheapSharkDeal {
    gameID: string
    title: string
    internalName?: string
    salePrice: string
    normalPrice: string
    savings: string
    releaseDate: string | number
    dealRating: string
    storeID?: string
    dealID?: string
}

export interface StoreOption {
    storeID: string
    storeName: string
    price: number
    originalPrice?: number
    discount?: number
    dealID?: string
    storeURL?: string
}

export interface PriceInfo {
    price: number | null
    originalPrice?: number
    discount?: number
    matchScore?: number
    matchStrategy?: string
    source: 'cheapshark' | null
    storeName?: string
    stores?: StoreOption[]
}

/**
 * Нормализует название игры для сопоставления
 * Убирает все пробелы, знаки препинания, приводит к верхнему регистру
 * Пример: "Tomb Raider: Anniversary" -> "TOMBRAIDERANNIVERSARY"
 */
const normalizeGameName = (title: string): string => {
    if (!title) return ''
    // Убираем все кроме букв и цифр, приводим к верхнему регистру
    return title
        .replace(/[^a-zA-Z0-9]/g, '')  // Убираем все кроме букв и цифр
        .toUpperCase()
}

/**
 * Получение цены игры из CheapShark
 */
export const getPriceFromCheapShark = async (
    rawgTitle: string,
    rawgReleased: string | null | undefined,
    hasPCPlatform: boolean,
    strategy: 'exact' | 'fuzzy' | 'hybrid' = 'hybrid'
): Promise<PriceInfo | null> => {
    try {
        // Если CheapShark отключен — возвращаем null
        if (isCheapSharkDisabled) {
            return null
        }
        
        // Проверяем, не заблокирован ли API
        if (isApiBlocked && blockUntil && Date.now() < blockUntil) {
            const remainingMinutes = Math.ceil((blockUntil - Date.now()) / 60000)
            console.log(`[CheapShark] API заблокирован, осталось ${remainingMinutes} минут`)
            return null
        }
        
        // Если блокировка истекла, снимаем флаг
        if (blockUntil && Date.now() >= blockUntil) {
            isApiBlocked = false
            blockUntil = null
            console.log(`[CheapShark] Блокировка снята, продолжаем работу`)
        }
        
        // Проверяем кэш ПЕРЕД любыми запросами
        const cacheKey = normalizeGameName(rawgTitle)
        const cached = priceCache.get(cacheKey)
        if (cached && Date.now() - cached.timestamp < PRICE_CACHE_TTL) {
            console.log(`[CheapShark] Используем кэш для "${rawgTitle}" (возраст: ${Math.round((Date.now() - cached.timestamp) / 3600000)}ч)`)
            return cached.priceInfo
        }
        
        // Если в кэше есть null (игра не найдена), не делаем повторный запрос
        if (cached && cached.priceInfo === null) {
            console.log(`[CheapShark] Игра "${rawgTitle}" ранее не найдена в кэше, пропускаем запрос`)
            return null
        }
        
        const { get } = useCheapSharkClient()
        
        // Нормализуем название из RAWG
        const normalizedRawgTitle = normalizeGameName(rawgTitle)
        
        // Используем эндпоинт /deals для поиска предложений
        // Согласно документации, можно использовать параметр title для поиска
        let allDeals: CheapSharkDeal[] = []
        
        // Пробуем запрос с повторными попытками при 429 ошибке
        let retries = 3
        let dealsResponse: any[] | null = null
        
        while (retries > 0) {
            try {
                // Используем /deals с параметром title для поиска
                dealsResponse = await get<any[]>('/deals', {
                    title: rawgTitle,
                    pageSize: 50 // Максимум согласно документации - 60
                }) as any[]
                
                if (Array.isArray(dealsResponse)) {
                    break // Успешно получили данные
                }
            } catch (apiError: any) {
                // Если это 429 ошибка (Too Many Requests) или блокировка, ждем и повторяем
                const isRateLimit = apiError.status === 429 || 
                                   apiError.statusCode === 429 ||
                                   apiError.message?.includes('rate limit') ||
                                   apiError.message?.includes('blocked') ||
                                   apiError.message?.includes('temporarily blocked')
                
                if (isRateLimit) {
                    // Если Retry-After больше 30 секунд, это серьезная блокировка - прекращаем попытки
                    const retryAfter = apiError.retryAfter || (4 - retries) * 1
                    if (retryAfter > 30) {
                        console.warn(`[CheapShark] Серьезная блокировка (Retry-After: ${retryAfter}с), блокируем API на 1 час`)
                        isApiBlocked = true
                        blockUntil = Date.now() + BLOCK_DURATION
                        priceCache.set(cacheKey, { priceInfo: null, timestamp: Date.now() })
                        return null
                    }
                    
                    retries--
                    if (retries > 0) {
                        // Используем Retry-After заголовок из ответа, если он есть
                        // Иначе используем экспоненциальную задержку: 1s, 2s, 3s (минимизировано для скорости)
                        const waitTime = retryAfter * 1000 // Конвертируем секунды в миллисекунды
                        console.warn(`[CheapShark] Rate limit для "${rawgTitle}", ждем ${waitTime/1000}с перед повтором... (осталось попыток: ${retries})`)
                        await new Promise(resolve => setTimeout(resolve, waitTime))
                        continue
                    } else {
                        console.error(`[CheapShark] Превышен лимит запросов для "${rawgTitle}" после 3 попыток. Блокируем API на 1 час.`)
                        // Устанавливаем блокировку на 1 час
                        isApiBlocked = true
                        blockUntil = Date.now() + BLOCK_DURATION
                        // Сохраняем null в кэш, чтобы не повторять запросы
                        priceCache.set(cacheKey, { priceInfo: null, timestamp: Date.now() })
                        return null
                    }
                } else {
                    // Другая ошибка - не повторяем
                    console.error(`[CheapShark] Ошибка поиска для "${rawgTitle}":`, apiError.message || apiError)
                    return null
                }
            }
        }
        
        if (dealsResponse && Array.isArray(dealsResponse)) {
            // Преобразуем в наш формат
            allDeals = dealsResponse.map((deal: any) => ({
                gameID: deal.gameID || '',
                title: deal.title || '',
                internalName: deal.internalName || undefined,
                salePrice: deal.salePrice || '0',
                normalPrice: deal.normalPrice || '0',
                savings: deal.savings || '0',
                releaseDate: deal.releaseDate || '',
                dealRating: deal.dealRating || '0',
                storeID: deal.storeID || undefined,
                dealID: deal.dealID || undefined
            }))
            
            // Логируем только если найдено много результатов
            if (allDeals.length > 0) {
                console.log(`[CheapShark] "${rawgTitle}": найдено ${allDeals.length} предложений`)
            }
        }
        
        if (allDeals.length === 0) {
            console.log(`[CheapShark] Предложения не найдены для "${rawgTitle}"`)
            // Сохраняем null в кэш, чтобы не повторять запросы
            priceCache.set(cacheKey, { priceInfo: null, timestamp: Date.now() })
            return null
        }
        
        // Удаляем дубликаты по gameID
        const uniqueDeals = Array.from(
            new Map(allDeals.map(d => [d.gameID, d])).values()
        )
        
        // Логируем только если есть результаты
        if (uniqueDeals.length > 0) {
            console.log(`[CheapShark] "${rawgTitle}": ${uniqueDeals.length} уникальных игр`)
        }
        
        // Используем стратегию сопоставления из gameMatching.ts
        // Преобразуем deals в формат для findBestMatch
        const cheapSharkGames = uniqueDeals.map(deal => ({
            gameID: deal.gameID,
            title: deal.title,
            releaseDate: typeof deal.releaseDate === 'number' 
                ? new Date(deal.releaseDate * 1000).toISOString().split('T')[0]
                : deal.releaseDate
        }))
        
        // Ищем лучшее совпадение используя выбранную стратегию
        const matchResult = findBestMatch(
            rawgTitle,
            rawgReleased,
            hasPCPlatform,
            cheapSharkGames,
            strategy
        )
        
        if (!matchResult.match || !matchResult.gameId) {
            console.log(`[CheapShark] Совпадение не найдено для "${rawgTitle}" (strategy: ${strategy}, score: ${matchResult.score.toFixed(2)})`)
            // Сохраняем null в кэш, чтобы не повторять запросы
            priceCache.set(cacheKey, { priceInfo: null, timestamp: Date.now() })
            return null
        }
        
        console.log(`[CheapShark] ✓ Совпадение найдено для "${rawgTitle}": "${matchResult.gameTitle}" (strategy: ${strategy}, score: ${matchResult.score.toFixed(2)})`)
        
        // Получаем все сделки для найденной игры
        const gameDeals = uniqueDeals.filter(d => d.gameID === matchResult.gameId)
        
        if (gameDeals.length === 0) {
            return null
        }
        
        const stores = await getCheapSharkStores()
        
        // Создаем список всех магазинов для этой игры
        const storeOptions: StoreOption[] = gameDeals
            .map(deal => {
                const salePrice = parseFloat(deal.salePrice || '0')
                const normalPrice = parseFloat(deal.normalPrice || salePrice.toString())
                
                // Пропускаем сделки с нулевой или отрицательной ценой
                if (salePrice <= 0 && normalPrice <= 0) {
                    return null
                }
                
                const discount = salePrice < normalPrice && normalPrice > 0
                    ? Math.round(((normalPrice - salePrice) / normalPrice) * 100)
                    : 0
                
                const storeName = deal.storeID ? stores.get(deal.storeID) : undefined
                const storeURL = deal.dealID 
                    ? `https://www.cheapshark.com/redirect?dealID=${deal.dealID}`
                    : undefined
                
                return {
                    storeID: deal.storeID || '',
                    storeName: storeName || 'Unknown Store',
                    price: salePrice > 0 ? salePrice : normalPrice,
                    originalPrice: normalPrice > salePrice ? normalPrice : undefined,
                    discount: discount > 0 ? discount : undefined,
                    dealID: deal.dealID,
                    storeURL
                }
            })
            .filter((deal): deal is StoreOption => deal !== null)
        
        if (storeOptions.length === 0) {
            console.log(`[CheapShark] Нет валидных цен для "${rawgTitle}"`)
            // Сохраняем null в кэш, чтобы не повторять запросы
            priceCache.set(cacheKey, { priceInfo: null, timestamp: Date.now() })
            return null
        }
        
        // Сортируем по цене (от меньшей к большей)
        storeOptions.sort((a, b) => a.price - b.price)
        
        // Берем лучшую цену (первую в отсортированном списке)
        const bestDeal = storeOptions[0]
        
        console.log(`[CheapShark] ✓ Цена найдена для "${rawgTitle}": $${bestDeal.price} (${bestDeal.storeName})`)
        
        const priceInfo: PriceInfo = {
            price: bestDeal.price,
            originalPrice: bestDeal.originalPrice,
            discount: bestDeal.discount,
            matchScore: matchResult.score,
            matchStrategy: matchResult.reason || strategy,
            source: 'cheapshark',
            storeName: bestDeal.storeName,
            stores: storeOptions.length > 1 ? storeOptions : undefined
        }
        
        // Сохраняем в кэш
        priceCache.set(cacheKey, { priceInfo, timestamp: Date.now() })
        
        return priceInfo
    } catch (error: any) {
        console.error(`[CheapShark] Ошибка при получении цены для "${rawgTitle}":`, error)
        
        // Если это rate limit ошибка, устанавливаем блокировку
        if (error?.status === 429 || error?.statusCode === 429 || 
            error?.message?.includes('rate limit') || 
            error?.message?.includes('blocked') ||
            error?.message?.includes('temporarily blocked')) {
            isApiBlocked = true
            blockUntil = Date.now() + BLOCK_DURATION
            console.warn(`[CheapShark] API заблокирован на 1 час из-за rate limit`)
        }
        
        // Сохраняем null в кэш, чтобы не повторять запросы
        const cacheKey = normalizeGameName(rawgTitle)
        priceCache.set(cacheKey, { priceInfo: null, timestamp: Date.now() })
        
        return null
    }
}

/**
 * Пакетное обогащение цен для списка игр
 */
export const enrichGamesWithPrices = async (
    games: Array<{
        id: number
        name: string
        released: string | null
        platforms: string[]
    }>,
    strategy: 'exact' | 'fuzzy' | 'hybrid' = 'hybrid'
): Promise<Map<number, PriceInfo>> => {
    const priceMap = new Map<number, PriceInfo>()
    
    // Если CheapShark отключен — возвращаем пустую карту
    if (isCheapSharkDisabled) {
        console.log('[CheapShark] Отключен, пропускаем поиск цен')
        return priceMap
    }

    console.log(`[CheapShark] Начинаем обогащение цен для ${games.length} игр`)
    
    // Проверяем, не заблокирован ли API
    if (isApiBlocked && blockUntil && Date.now() < blockUntil) {
        const remainingMinutes = Math.ceil((blockUntil - Date.now()) / 60000)
        console.warn(`[CheapShark] API заблокирован, пропускаем поиск цен. Осталось ${remainingMinutes} минут`)
        return priceMap
    }
    
    // Сначала проверяем кеш для всех игр
    let cachedCount = 0
    for (const game of games) {
        const cacheKey = normalizeGameName(game.name)
        const cached = priceCache.get(cacheKey)
        if (cached && Date.now() - cached.timestamp < PRICE_CACHE_TTL) {
            if (cached.priceInfo && cached.priceInfo.price !== null) {
                priceMap.set(game.id, cached.priceInfo)
                cachedCount++
            }
        }
    }
    
    if (cachedCount > 0) {
        console.log(`[CheapShark] Из кеша получено ${cachedCount} из ${games.length} игр`)
    }
    
    // Фильтруем игры, которые уже есть в кеше
    const gamesToProcess = games.filter(game => {
        const cacheKey = normalizeGameName(game.name)
        const cached = priceCache.get(cacheKey)
        // Обрабатываем только те игры, которых нет в кеше или кеш истек
        return !cached || Date.now() - cached.timestamp >= PRICE_CACHE_TTL
    })
    
    if (gamesToProcess.length === 0) {
        console.log(`[CheapShark] Все игры уже в кеше, запросы к API не требуются`)
        return priceMap
    }
    
    console.log(`[CheapShark] Требуется обработать ${gamesToProcess.length} игр (${games.length - gamesToProcess.length} уже в кеше)`)
    
    // Обрабатываем только игры, которых нет в кеше
    // Уменьшено до 2 одновременных запросов для избежания 429 ошибок
    const MAX_CONCURRENT = 2
    console.log(`[CheapShark] Обрабатываем ${gamesToProcess.length} игр параллельно (макс. ${MAX_CONCURRENT} одновременно)`)
    
    // Флаг для остановки обработки при rate limit
    let shouldStop = false
    
    // Разделяем игры на группы для параллельной обработки
    const processGame = async (game: typeof games[0]): Promise<void> => {
        // Проверяем флаг остановки
        if (shouldStop) {
            return
        }
        
        // Проверяем блокировку перед запросом
        if (isApiBlocked && blockUntil && Date.now() < blockUntil) {
            shouldStop = true
            return
        }
        
        // Проверяем кэш - если игра уже в кэше, используем кэш
        const cacheKey = normalizeGameName(game.name)
        const cached = priceCache.get(cacheKey)
        if (cached && Date.now() - cached.timestamp < PRICE_CACHE_TTL) {
            if (cached.priceInfo && cached.priceInfo.price !== null) {
                priceMap.set(game.id, cached.priceInfo)
            }
            // Если в кэше null (игра не найдена), тоже пропускаем запрос
            return
        }
        
        try {
            const hasPCPlatform = game.platforms.some(p => 
                p.toLowerCase().includes('pc') || 
                p.toLowerCase().includes('windows') ||
                p.toLowerCase().includes('linux') ||
                p.toLowerCase().includes('mac')
            )
            
            const priceInfo = await getPriceFromCheapShark(
                game.name,
                game.released,
                hasPCPlatform,
                strategy
            )
            
            // Добавляем в карту только если цена найдена
            if (priceInfo && priceInfo.price !== null) {
                priceMap.set(game.id, priceInfo)
            }
        } catch (error: any) {
            // Если получили rate limit ошибку, устанавливаем блокировку и останавливаем обработку
            if (error?.status === 429 || error?.statusCode === 429 || 
                error?.message?.includes('rate limit') || 
                error?.message?.includes('blocked') ||
                error?.message?.includes('temporarily blocked')) {
                console.warn(`[CheapShark] Обнаружен rate limit, блокируем API на 1 час и останавливаем обработку`)
                isApiBlocked = true
                blockUntil = Date.now() + BLOCK_DURATION
                shouldStop = true
                return
            }
            console.error(`[CheapShark] Ошибка при получении цены для игры ${game.id} (${game.name}):`, error.message || error)
        }
    }
    
    // Параллельная обработка с ограничением количества одновременных запросов
    const processBatch = async (batch: typeof games) => {
        const promises = batch.map(game => processGame(game))
        const results = await Promise.allSettled(promises)
        
        // Проверяем, были ли 429 ошибки
        const hasRateLimit = results.some(result => 
            result.status === 'rejected' && 
            (result.reason?.status === 429 || 
             result.reason?.statusCode === 429 ||
             result.reason?.message?.includes('rate limit'))
        )
        
        if (hasRateLimit) {
            shouldStop = true
            console.warn(`[CheapShark] Обнаружен rate limit в батче, прекращаем обработку`)
            return
        }
        
        // Увеличена задержка между батчами для избежания rate limit
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 500)) // 1-1.5 секунды
    }
    
    // Обрабатываем игры батчами
    for (let i = 0; i < gamesToProcess.length; i += MAX_CONCURRENT) {
        // Проверяем флаг остановки и блокировку перед каждым батчем
        if (shouldStop || (isApiBlocked && blockUntil && Date.now() < blockUntil)) {
            console.warn(`[CheapShark] API заблокирован во время обработки, прекращаем`)
            break
        }
        
        const batch = gamesToProcess.slice(i, i + MAX_CONCURRENT)
        await processBatch(batch)
        
        // Если установлен флаг остановки, прекращаем цикл
        if (shouldStop) {
            break
        }
    }
    
    const totalFound = priceMap.size
    const fromCache = cachedCount
    const fromApi = totalFound - fromCache
    console.log(`[CheapShark] Обогащение завершено. Всего цен: ${totalFound} (из кеша: ${fromCache}, из API: ${fromApi}) из ${games.length} игр`)
    
    return priceMap
}
