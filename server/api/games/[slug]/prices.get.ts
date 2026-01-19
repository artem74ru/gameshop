/**
 * Получение всех цен из CheapShark для конкретной игры
 * Использует точный поиск через /games endpoint для получения только нужной игры
 * Название игры получается из RAWG API
 */
import { useCheapSharkClient } from '~/server/utils/cheapsharkClient'
import { useRawgClient } from '~/server/utils/rawgClient'

interface CheapSharkDeal {
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
  thumb?: string
  steamAppID?: string
}

interface CheapSharkStore {
  storeID: string
  storeName: string
}

interface PriceComparison {
  storeID: string
  storeName: string
  price: number
  originalPrice: number
  discount: number
  dealID: string
  dealRating: string
  storeURL: string
  thumb?: string
}

export default defineCachedEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  
  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Slug is required'
    })
  }

  // Проверяем, отключен ли CheapShark
  if (process.env.DISABLE_CHEAPSHARK === '1') {
    return { prices: [] }
  }

  try {
    const { get } = useCheapSharkClient()
    
    // Получаем список магазинов (кешируем в памяти, так как список меняется редко)
    // Используем глобальный кеш для списка магазинов
    const storesCacheKey = 'cheapshark_stores'
    let storesMap = new Map<string, string>()
    
    // В production можно использовать useStorage() для персистентного кеша
    // Здесь используем простой in-memory кеш с TTL
    const cachedStores = (globalThis as any)[storesCacheKey] as { data: CheapSharkStore[], timestamp: number } | undefined
    const storesCacheTTL = 3600000 // 1 час
    
    let stores: CheapSharkStore[] = []
    
    if (cachedStores && Date.now() - cachedStores.timestamp < storesCacheTTL) {
      // Используем кешированный список
      stores = cachedStores.data
      console.log(`[Prices] Используем кешированный список магазинов`)
    } else {
      // Загружаем список магазинов
      try {
        stores = await get<CheapSharkStore[]>('/stores') as CheapSharkStore[]
        // Сохраняем в кеш
        ;(globalThis as any)[storesCacheKey] = {
          data: stores,
          timestamp: Date.now()
        }
        console.log(`[Prices] Загружен список магазинов (${stores.length} магазинов)`)
      } catch (error: any) {
        console.error(`[Prices] Ошибка при загрузке списка магазинов:`, error)
        // Если это 429, используем кеш если есть, иначе возвращаем пустой результат
        if (error?.statusCode === 429 || error?.status === 429) {
          if (cachedStores) {
            stores = cachedStores.data
            console.log(`[Prices] Используем устаревший кеш из-за 429 ошибки`)
          } else {
            return { prices: [] }
          }
        } else {
          return { prices: [] }
        }
      }
    }
    
    stores.forEach(store => {
      storesMap.set(store.storeID, store.storeName)
    })

    // Получаем название игры из RAWG API
    let gameTitle: string | null = null
    let rawgGameName: string | null = null
    
    try {
      const { get: getRawg } = useRawgClient()
      // Используем увеличенный таймаут и retry для получения названия игры
      const rawgGame = await getRawg(`/games/${slug}`, {}, { timeout: 20000, retries: 2 }) as { name: string }
      
      if (rawgGame && rawgGame.name) {
        gameTitle = rawgGame.name
        rawgGameName = rawgGame.name
        console.log(`[Prices] Получено название из RAWG: "${gameTitle}" для slug: ${slug}`)
      }
    } catch (error) {
      console.error(`[Prices] Ошибка при получении игры из RAWG для slug ${slug}:`, error)
      return { prices: [] }
    }
    
    if (!gameTitle) {
      console.warn(`[Prices] Не удалось получить название игры для slug: ${slug}`)
      return { prices: [] }
    }

    // Шаг 1: Находим gameID через точный поиск в /games
    let gameID: string | null = null
    
    try {
      // Используем endpoint /games с exact=1 для точного поиска
      const gamesResult = await get<any[]>('/games', {
        title: gameTitle,
        exact: 1
      }) as any[]
      
      if (gamesResult && Array.isArray(gamesResult) && gamesResult.length > 0) {
        // Ищем точное совпадение по названию
        const exactMatch = gamesResult.find((game: any) => {
          const title = (game.gameName || game.external || game.title || '').toLowerCase()
          const searchTitle = gameTitle.toLowerCase()
          return title === searchTitle ||
                 title.includes(searchTitle) ||
                 searchTitle.includes(title)
        })
        
        if (exactMatch && exactMatch.gameID) {
          gameID = String(exactMatch.gameID)
          console.log(`[Prices] Найден gameID: ${gameID} для "${gameTitle}"`)
        } else if (gamesResult[0] && gamesResult[0].gameID) {
          // Если точного совпадения нет, берем первый результат
          gameID = String(gamesResult[0].gameID)
          console.log(`[Prices] Используем первый найденный gameID: ${gameID} для "${gameTitle}"`)
        }
      }
    } catch (error: any) {
      console.warn(`[Prices] Не удалось получить gameID через /games для "${gameTitle}":`, error)
      // Если это 429, не пробуем дальше
      if (error?.statusCode === 429 || error?.status === 429) {
        return { prices: [] }
      }
    }

    // Шаг 2: Если нашли gameID, получаем все deals только для этой игры
    let allDeals: CheapSharkDeal[] = []
    
    if (gameID) {
      try {
        // Используем endpoint /games?id={gameID} для получения всех deals только для этой игры
        const gameData = await get<any>(`/games`, {
          id: gameID
        }) as any
        
        if (gameData && gameData.deals && Array.isArray(gameData.deals)) {
          allDeals = gameData.deals.map((deal: any) => ({
            gameID: deal.gameID || gameID,
            title: deal.title || gameData.gameInfo?.name || gameTitle,
            internalName: deal.internalName,
            salePrice: deal.salePrice || '0',
            normalPrice: deal.normalPrice || '0',
            savings: deal.savings || '0',
            releaseDate: deal.releaseDate || 0,
            dealRating: deal.dealRating || '0',
            storeID: deal.storeID,
            dealID: deal.dealID,
            thumb: deal.thumb,
            steamAppID: deal.steamAppID
          }))
          console.log(`[Prices] Получено ${allDeals.length} deals для gameID ${gameID} (${gameTitle})`)
        }
      } catch (error) {
        console.error(`[Prices] Ошибка при получении deals по gameID для "${gameTitle}":`, error)
        // Если не получилось, пробуем через /deals с exact=1
      }
    }
    
    // Шаг 3: Если не получилось через gameID, используем /deals с exact=1
    if (allDeals.length === 0) {
      try {
        console.log(`[Prices] Пробуем поиск через /deals с exact=1 для "${gameTitle}"`)
        const deals = await get<CheapSharkDeal[]>('/deals', {
          title: gameTitle,
          exact: 1,
          pageSize: 60
        }) as CheapSharkDeal[]
        
        if (deals && Array.isArray(deals)) {
          allDeals = deals
          console.log(`[Prices] Получено ${allDeals.length} deals через /deals с exact=1 для "${gameTitle}"`)
        } else {
          console.log(`[Prices] /deals с exact=1 вернул пустой результат для "${gameTitle}"`)
        }
      } catch (error: any) {
        console.error(`[Prices] Ошибка при поиске deals для "${gameTitle}":`, error)
        if (error?.statusCode === 429 || error?.status === 429) {
          console.warn('[Prices] Достигнут лимит запросов к CheapShark API')
        }
      }
    }
    
    // Если все еще нет deals, пробуем без exact=1 (более широкий поиск)
    if (allDeals.length === 0 && !gameID) {
      try {
        console.log(`[Prices] Пробуем поиск через /deals без exact=1 для "${gameTitle}"`)
        const deals = await get<CheapSharkDeal[]>('/deals', {
          title: gameTitle,
          pageSize: 60
        }) as CheapSharkDeal[]
        
        if (deals && Array.isArray(deals)) {
          allDeals = deals
          console.log(`[Prices] Получено ${allDeals.length} deals через /deals без exact=1 для "${gameTitle}"`)
        } else {
          console.log(`[Prices] /deals без exact=1 вернул пустой результат для "${gameTitle}"`)
        }
      } catch (error: any) {
        console.error(`[Prices] Ошибка при поиске deals без exact=1 для "${gameTitle}":`, error)
        if (error?.statusCode === 429 || error?.status === 429) {
          console.warn('[Prices] Достигнут лимит запросов к CheapShark API')
        }
      }
    }

    // СТРОГАЯ фильтрация deals - для всех игр
    // Используем множественные проверки для точного сопоставления
    const filteredDeals = allDeals.filter(deal => {
      if (!deal.title) return false
      
      const dealTitle = deal.title.trim()
      const dealTitleLower = deal.title.toLowerCase().trim()
      const internalName = (deal.internalName || '').toLowerCase()
      
      // Проверка 1: ОБЯЗАТЕЛЬНАЯ проверка gameID (если есть) - самая надежная
      if (gameID) {
        if (!deal.gameID || String(deal.gameID) !== gameID) {
          console.log(`[Prices Filter] Отклонено (неверный gameID): "${dealTitle}" (ожидался ${gameID}, получен ${deal.gameID})`)
          return false
        }
        // Если gameID совпадает, это точно нужная игра
        console.log(`[Prices Filter] ✓ Принято по gameID: "${dealTitle}" для "${gameTitle}"`)
        return true
      }
      
      // Проверка 2: Нормализация названий для сравнения
      const normalizeForComparison = (title: string): string => {
        return title
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, '') // Убираем спецсимволы, но оставляем пробелы
          .replace(/\s+/g, ' ') // Множественные пробелы в один
          .trim()
          .replace(/\b(goty|deluxe|definitive|complete|edition|remastered|remaster|bundle|pack|dlc|addon|expansion|season pass|ultimate|gold|special|collector|premium|standard|hd|enhanced|directors cut|extended|anniversary|game of the year)\b/gi, '')
          .replace(/\s+/g, ' ')
          .trim()
      }
      
      const normalizedRawgTitle = normalizeForComparison(gameTitle)
      const normalizedDealTitle = normalizeForComparison(dealTitle)
      
      // Проверка 3: Извлекаем ключевые слова из названий (слова длиннее 2 символов)
      const getKeywords = (title: string): string[] => {
        return title
          .toLowerCase()
          .split(/\s+/)
          .filter(word => word.length > 2)
          .filter(word => !['the', 'and', 'or', 'of', 'for', 'in', 'on', 'at', 'to', 'a', 'an'].includes(word))
      }
      
      const rawgKeywords = getKeywords(normalizedRawgTitle)
      const dealKeywords = getKeywords(normalizedDealTitle)
      
      // Проверка 4: Большинство ключевых слов из RAWG должны присутствовать в deal
      if (rawgKeywords.length === 0) {
        console.log(`[Prices Filter] Отклонено (нет ключевых слов в RAWG названии): "${dealTitle}"`)
        return false
      }
      
      const matchingKeywords = rawgKeywords.filter(rawgKeyword => 
        dealKeywords.some(dealKeyword => 
          dealKeyword === rawgKeyword || 
          dealKeyword.includes(rawgKeyword) || 
          rawgKeyword.includes(dealKeyword)
        )
      )
      
      // Требуем совпадения минимум 60% ключевых слов (если есть gameID, то 70%)
      // Если gameID нет, делаем менее строгую проверку
      const requiredMatchRatio = gameID ? 0.7 : 0.6
      const matchRatio = matchingKeywords.length / rawgKeywords.length
      if (matchRatio < requiredMatchRatio) {
        console.log(`[Prices Filter] Отклонено (мало совпадающих ключевых слов): "${dealTitle}" (совпало ${matchingKeywords.length} из ${rawgKeywords.length}, ${Math.round(matchRatio * 100)}%, требуется ${Math.round(requiredMatchRatio * 100)}%)`)
        return false
      }
      
      // Проверка 5: Проверяем, что название deal начинается с ключевых слов из RAWG
      // Или содержит их в начале (первые 20 символов)
      // Эта проверка менее строгая, если у нас нет gameID
      if (rawgKeywords.length > 2) {
        const rawgFirstWords = normalizedRawgTitle.split(/\s+/).slice(0, 3).join(' ') // Первые 3 слова
        const dealFirstWords = normalizedDealTitle.split(/\s+/).slice(0, 3).join(' ')
        
        // Проверяем, что первые слова похожи
        const firstWordsMatch = rawgFirstWords.substring(0, 10) === dealFirstWords.substring(0, 10) ||
                                dealFirstWords.includes(rawgFirstWords.substring(0, 8)) ||
                                rawgFirstWords.includes(dealFirstWords.substring(0, 8))
        
        if (!firstWordsMatch) {
          // Если первые слова не совпадают, проверяем, что хотя бы 2 ключевых слова из начала есть в deal
          // Если нет gameID, требуем только 1 ключевое слово
          const requiredFirstKeywords = gameID ? 2 : 1
          const rawgFirstKeywords = rawgKeywords.slice(0, Math.min(3, rawgKeywords.length))
          const hasFirstKeywords = rawgFirstKeywords.filter(kw => 
            dealKeywords.some(dk => dk === kw || dk.includes(kw) || kw.includes(dk))
          ).length >= requiredFirstKeywords
          
          if (!hasFirstKeywords) {
            console.log(`[Prices Filter] Отклонено (первые ключевые слова не совпадают): "${dealTitle}"`)
            return false
          }
        }
      }
      
      // Проверка 6: Исключаем игры с подозрительно длинными названиями, которые не начинаются с ключевых слов
      if (dealTitle.length > 50 && !normalizedDealTitle.startsWith(normalizedRawgTitle.substring(0, 10))) {
        // Если название очень длинное и не начинается с ключевых слов RAWG, это может быть другая игра
        const hasKeywordsInStart = rawgKeywords.slice(0, 2).some(kw => 
          normalizedDealTitle.substring(0, 30).includes(kw)
        )
        if (!hasKeywordsInStart) {
          console.log(`[Prices Filter] Отклонено (длинное название без ключевых слов в начале): "${dealTitle}"`)
          return false
        }
      }
      
      console.log(`[Prices Filter] ✓ Принято: "${dealTitle}" для "${gameTitle}" (совпало ${matchingKeywords.length}/${rawgKeywords.length} ключевых слов)`)
      return true
    })

    console.log(`[Prices] После фильтрации осталось ${filteredDeals.length} deals из ${allDeals.length} для "${gameTitle}"`)
    
    // Убираем дубликаты по комбинации dealID + storeID (один dealID может быть в разных магазинах)
    const uniqueDeals = new Map<string, CheapSharkDeal>()
    filteredDeals.forEach(deal => {
      // Используем комбинацию dealID + storeID как уникальный ключ
      // Это позволяет иметь один dealID в разных магазинах
      const uniqueKey = deal.dealID 
        ? `${deal.dealID}_${deal.storeID || 'unknown'}`
        : `${deal.storeID || 'unknown'}_${deal.title}`
      
      if (!uniqueDeals.has(uniqueKey)) {
        uniqueDeals.set(uniqueKey, deal)
        console.log(`[Prices] Добавлен deal: storeID=${deal.storeID}, dealID=${deal.dealID || 'none'}, price=${deal.salePrice}`)
      } else {
        console.log(`[Prices] Пропущен дубликат: dealID=${deal.dealID}, storeID=${deal.storeID}, title="${deal.title}"`)
      }
    })
    
    console.log(`[Prices] После удаления дубликатов осталось ${uniqueDeals.size} уникальных deals для "${gameTitle}"`)

    // Преобразуем deals в формат PriceComparison
    const prices: PriceComparison[] = Array.from(uniqueDeals.values())
      .map(deal => {
        const salePrice = parseFloat(deal.salePrice || '0')
        const normalPrice = parseFloat(deal.normalPrice || '0')
        const savings = parseFloat(deal.savings || '0')
        
        // Формируем URL магазина
        // CheapShark использует формат: https://www.cheapshark.com/redirect?dealID=...
        const storeURL = deal.dealID 
          ? `https://www.cheapshark.com/redirect?dealID=${deal.dealID}`
          : ''

        const storeName = storesMap.get(deal.storeID || '') || 'Unknown Store'
        
        const priceObj = {
          storeID: deal.storeID || '',
          storeName,
          price: salePrice,
          originalPrice: normalPrice,
          discount: savings,
          dealID: deal.dealID || '',
          dealRating: deal.dealRating || '0',
          storeURL,
          thumb: deal.thumb
        }
        
        console.log(`[Prices] Преобразован deal: store="${storeName}", price=${salePrice}, dealID=${deal.dealID || 'none'}`)
        return priceObj
      })
      .sort((a, b) => {
        // Сортируем: сначала цены > 0 (от меньшей к большей), затем цены = 0
        if (a.price > 0 && b.price > 0) {
          return a.price - b.price
        }
        if (a.price > 0) return -1
        if (b.price > 0) return 1
        return 0
      })

    console.log(`[Prices] Финальный результат: ${prices.length} цен для "${gameTitle}"`)
    if (prices.length > 0) {
      console.log(`[Prices] Примеры цен:`, prices.slice(0, 3).map(p => `${p.storeName}: $${p.price}`))
    }

    return { prices }
  } catch (error: any) {
    console.error('Ошибка при получении цен из CheapShark:', error)
    
    // Если это 429 ошибка, возвращаем пустой массив
    if (error?.statusCode === 429 || error?.status === 429) {
      return { prices: [] }
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Ошибка при получении цен из CheapShark'
    })
  }
}, {
  maxAge: 7200, // Кэш на 2 часа (цены не меняются так часто)
  getKey: (event) => {
    const slug = getRouterParam(event, 'slug')
    return `game-prices-${slug}`
  }
})
