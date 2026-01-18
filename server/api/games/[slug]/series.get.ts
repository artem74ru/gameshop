import { defineEventHandler, getRouterParams } from 'h3'
import { useRawgClient } from '../../../utils/rawgClient'
import { generatePriceFromId } from '../../../utils/price'
import { filterSexualContent } from '../../../utils/contentFilter'

interface RawgGame {
    id: number
    slug: string
    name: string
    released: string
    rating: number
    background_image: string
    background_image_additional?: string | null
    short_screenshots?: Array<{ image: string }>
    platforms?: Array<{ platform: { name: string } }>
    genres?: Array<{ id: number; name: string; slug: string }>
    tags?: Array<{ slug: string; name: string }>
    esrb_rating?: { id: number; name: string; slug: string } | null
}

interface RawgResponse {
    results: RawgGame[]
    count: number
}

export default defineEventHandler(async (event) => {
    try {
        const { slug } = getRouterParams(event)
        const { get } = useRawgClient()

        // Получаем информацию об игре
        const gameDetail = await get(`/games/${slug}`) as { 
            id: number
            name: string
            game_series?: Array<{ id: number; name: string; slug: string }>
        }

        // Если есть game_series с ID, используем параметр series для точного поиска
        if (gameDetail.game_series && gameDetail.game_series.length > 0) {
            const seriesId = gameDetail.game_series[0].id
            
            // Получаем игры из той же серии используя параметр series
            const seriesGames = await get('/games', {
                series: seriesId,
                page_size: 50,
                ordering: '-released'
            }) as RawgResponse

            // Фильтруем игры с сексуальным контентом
            const filteredSeries = filterSexualContent(seriesGames.results)
            
            // Фильтруем игры из той же серии
            const results = filteredSeries
                .filter(g => {
                    // Исключаем текущую игру
                    if (g.id === gameDetail.id || g.slug === slug) return false
                    
                    // Исключаем DLC
                    const gameNameLower = g.name.toLowerCase()
                    if (gameNameLower.includes('dlc') || 
                        gameNameLower.includes('add-on') || 
                        gameNameLower.includes('addon') ||
                        gameNameLower.includes('expansion pack') ||
                        gameNameLower.includes('expansion')) {
                        return false
                    }

                    return true
                })
                .slice(0, 20)
                .map((g) => ({
                    id: g.id,
                    slug: g.slug,
                    name: g.name,
                    released: g.released,
                    rating: g.rating,
                    backgroundImage: g.background_image || (g as any).background_image_additional || '',
                    platforms: (g.platforms ?? []).map((p) => p.platform.name),
                    price: generatePriceFromId(g.id),
                    ageRating: g.esrb_rating?.name || null
                }))

            return {
                results,
                count: results.length
            }
        }

        // Fallback: если нет game_series, используем поиск по названию (старый метод)
        // Извлекаем базовое название серии из названия игры
        const extractBaseSeriesName = (gameName: string): string => {
            // Список предлогов и артиклей для исключения
            const articles = ['the', 'a', 'an', 'le', 'la', 'les', 'el', 'los', 'las', 'der', 'die', 'das', 'il', 'lo', 'gli', 'le']
            
            // Убираем римские цифры
            let base = gameName.replace(/\s+(I{1,3}|IV|V|VI{0,3}|IX|X{0,3}|XI|XII|XIII|XIV|XV).*$/i, '')
            // Убираем арабские цифры
            base = base.replace(/\s+[0-9]+.*$/i, '')
            // Убираем слова типа Remake, Remastered, HD, Edition и т.д.
            base = base.replace(/\s+(Remake|Remastered|HD|Edition|Definitive|Complete|Ultimate|Deluxe|Collector|Special|Gold|GOTY|Game of the Year).*$/i, '')
            // Убираем части типа "Part 1", "Chapter 1" и т.д.
            base = base.replace(/\s+(Part|Chapter|Episode)\s+[0-9IVX]+.*$/i, '')
            
            // Убираем предлоги и артикли из начала названия
            const words = base.trim().split(/\s+/)
            const filteredWords = words.filter((word, index) => {
                const lowerWord = word.toLowerCase().replace(/[^\w]/g, '')
                // Исключаем артикли только если они в начале
                if (index === 0 && articles.includes(lowerWord)) {
                    return false
                }
                return true
            })
            
            return filteredWords.join(' ').trim()
        }

        const baseSeriesName = extractBaseSeriesName(gameDetail.name)

        // Если базовое название слишком короткое (меньше 3 символов), возвращаем пустой массив
        if (baseSeriesName.length < 3) {
            return {
                results: [],
                count: 0
            }
        }

        // Ищем игры по базовому названию серии
        const searchResults = await get('/games', {
            search: baseSeriesName,
            page_size: 100,
            ordering: '-released'
        }) as RawgResponse

        // Функция для нормализации названия (убираем лишние символы, предлоги, приводим к нижнему регистру)
        const normalizeName = (name: string): string => {
            // Список предлогов и артиклей для исключения
            const articles = ['the', 'a', 'an', 'le', 'la', 'les', 'el', 'los', 'las', 'der', 'die', 'das', 'il', 'lo', 'gli', 'le']
            
            return name.toLowerCase()
                .replace(/[^\w\s]/g, '') // Убираем спецсимволы
                .replace(/\s+/g, ' ') // Множественные пробелы в один
                .split(' ')
                .filter(word => word.length > 0 && !articles.includes(word)) // Исключаем предлоги и артикли
                .join(' ')
                .trim()
        }

        const normalizedBaseName = normalizeName(baseSeriesName)
        const baseWords = normalizedBaseName.split(' ').filter(w => w.length > 2) // Слова длиннее 2 символов

        // Если нет ключевых слов после фильтрации, возвращаем пустой результат
        if (baseWords.length === 0) {
            return {
                results: [],
                count: 0
            }
        }

        // Функция для извлечения слов из названия (строгое сравнение)
        const extractWords = (name: string): string[] => {
            return normalizeName(name)
                .split(' ')
                .filter(w => w.length > 2) // Только слова длиннее 2 символов
        }

        // Фильтруем игры с сексуальным контентом
        const filteredSearch = filterSexualContent(searchResults.results)
        
        // Фильтруем игры из той же серии
        const results = filteredSearch
            .filter(g => {
                // Исключаем текущую игру
                if (g.id === gameDetail.id || g.slug === slug) return false
                
                // Исключаем DLC
                const gameNameLower = g.name.toLowerCase()
                if (gameNameLower.includes('dlc') || 
                    gameNameLower.includes('add-on') || 
                    gameNameLower.includes('addon') ||
                    gameNameLower.includes('expansion pack')) {
                    return false
                }

                // Извлекаем слова из названия игры
                const gameWords = extractWords(g.name)
                
                // Строгое сравнение: все слова из базового названия должны присутствовать в названии игры
                // Каждое слово должно совпадать точно (1 в 1)
                // Например, если базовое название содержит "Lego", то в названии игры должно быть точно слово "Lego"
                const allBaseWordsMatch = baseWords.every(baseWord => 
                    gameWords.some(gameWord => gameWord === baseWord)
                )
                
                return allBaseWordsMatch
            })
            .slice(0, 20)
            .map((g) => {
                // Приоритет изображения: официальная обложка (short_screenshots[0]) > background_image > background_image_additional
                const gameImage = (g.short_screenshots && g.short_screenshots.length > 0 && g.short_screenshots[0]?.image)
                    || g.background_image
                    || g.background_image_additional
                    || ''
                
                return {
                    id: g.id,
                    slug: g.slug,
                    name: g.name,
                    released: g.released,
                    rating: g.rating,
                    backgroundImage: gameImage,
                    platforms: (g.platforms ?? []).map((p) => p.platform.name),
                    genres: (g.genres ?? []).map((gen) => ({ id: gen.id, name: gen.name, slug: gen.slug })),
                    price: generatePriceFromId(g.id),
                    ageRating: g.esrb_rating?.name || null,
                    tags: g.tags || []
                }
            })

        return {
            results,
            count: results.length
        }
    } catch (error) {
        console.error('Error loading series games:', error)
        return {
            results: [],
            count: 0
        }
    }
})

