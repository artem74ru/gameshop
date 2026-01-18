import { defineEventHandler, getRouterParams, getQuery } from 'h3'
import { useRawgClient } from '../../../utils/rawgClient'

interface RawgReview {
    id: number
    user?: string | { username?: string; name?: string }
    username?: string
    rating?: number | null
    text?: string
    review?: string
    date?: string
    created?: string
    helpful_count?: number
    helpful?: number
}

interface RawgReviewsResponse {
    results: RawgReview[]
    count: number
}

export default defineEventHandler(async (event) => {
    try {
        const { slug } = getRouterParams(event)
        const query = getQuery(event)
        const { get } = useRawgClient()

        // Получаем ID игры сначала
        const gameDetail = await get(`/games/${slug}`) as { id: number }
        
        const page = Number(query.page ?? 1)
        const pageSize = Number(query.pageSize ?? 20)

        // Получаем отзывы
        const reviewsData = await get(`/games/${gameDetail.id}/reviews`, { 
            page,
            page_size: pageSize
        }) as RawgReviewsResponse

        const results = reviewsData.results.map((r) => {
            // Обрабатываем поле user - может быть строкой или объектом
            let userName = 'Анонимный пользователь'
            if (typeof r.user === 'string') {
                userName = r.user
            } else if (r.user && typeof r.user === 'object') {
                userName = r.user.username || r.user.name || userName
            } else if (r.username) {
                userName = r.username
            }

            return {
                id: r.id,
                user: userName,
                rating: r.rating ?? null,
                text: r.text || r.review || '',
                date: r.date || r.created || new Date().toISOString(),
                helpfulCount: r.helpful_count || r.helpful || 0
            }
        })

        return {
            results,
            count: reviewsData.count,
            page,
            pageSize
        }
    } catch (error) {
        // Если нет отзывов, возвращаем пустой массив
        return {
            results: [],
            count: 0,
            page: 1,
            pageSize: 20
        }
    }
})

