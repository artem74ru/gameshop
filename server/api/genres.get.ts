import { defineEventHandler } from 'h3'
import { fetchAllResults } from '../utils/fetchAllResults'

interface RawgGenre {
    id: number
    name: string
    slug: string
    games_count: number
}

interface RawgGenresResponse {
    results: RawgGenre[]
    count: number
}

// Кеш для жанров (меняются редко)
let genresCache: { data: any; timestamp: number } | null = null
const GENRES_CACHE_TTL = 3600 * 1000 // 1 час

export default defineEventHandler(async (event) => {
    try {
        // Проверяем кеш
        if (genresCache && Date.now() - genresCache.timestamp < GENRES_CACHE_TTL) {
            setHeader(event, 'X-Cache', 'HIT')
            setHeader(event, 'Cache-Control', 'public, max-age=3600, s-maxage=3600')
            return genresCache.data
        }
        
        setHeader(event, 'X-Cache', 'MISS')
        setHeader(event, 'Cache-Control', 'public, max-age=3600, s-maxage=3600')
        
        // Получаем все жанры через пагинацию
        const allGenres = await fetchAllResults<RawgGenre>('/genres', {}, 40)

        const result = {
            results: allGenres
                .filter(g => g.games_count > 0)
                .map((g) => ({
                    id: g.id,
                    name: g.name,
                    slug: g.slug,
                    gamesCount: g.games_count
                }))
                .sort((a, b) => b.gamesCount - a.gamesCount)
        }
        
        // Сохраняем в кеш
        genresCache = {
            data: result,
            timestamp: Date.now()
        }
        
        return result
    } catch (error) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Ошибка при загрузке жанров',
            data: error
        })
    }
})

