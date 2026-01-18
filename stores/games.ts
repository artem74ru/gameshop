import { defineStore } from 'pinia'

interface Game {
    id: number
    slug: string
    name: string
    released: string
    rating: number
    backgroundImage: string
    platforms: string[]
    price?: number | null
    originalPrice?: number
    discount?: number
    priceSource?: 'cheapshark' | 'generated' | 'console_store' | null
    priceNote?: string | null
    storeName?: string
    storeURL?: string
    stores?: Array<{
        storeID: string
        storeName: string
        price: number
        originalPrice?: number
        discount?: number
        dealID?: string
        storeURL?: string
    }>
    description?: string
    isDLC?: boolean
    ageRating?: string | null
    tags?: Array<{ slug: string; name: string }>
}

interface GamesResponse {
    results: Game[]
    page: number
    pageSize: number
    total: number
}

export const useGamesStore = defineStore('gamesStore', {
    state: () => ({
        games: [] as Game[],
        page: 1,
        pageSize: 20, // Увеличено с 12 до 20 для лучшей загрузки
        total: 0,

        loading: false,
        error: null as string | null,

        search: '',
        sort: '',
        platforms: '',
        genres: '',
        publishers: '',
        developers: '',
        stores: '',
        tags: '',
        dates: '',
        metacritic: '',
        ratingMin: '',
        ratingMax: '',
    }),

    actions: {
        async fetchGames() {
            this.loading = true
            this.error = null

            try {
                const query: Record<string, any> = {
                    page: this.page,
                    pageSize: this.pageSize,
                }

                if (this.search) query.search = this.search
                if (this.sort) query.sort = this.sort
                if (this.platforms) query.platforms = this.platforms
                if (this.genres) query.genres = this.genres
                if (this.publishers) query.publishers = this.publishers
                if (this.developers) query.developers = this.developers
                if (this.stores) query.stores = this.stores
                if (this.tags) query.tags = this.tags
                if (this.dates) query.dates = this.dates
                if (this.metacritic) query.metacritic = this.metacritic
                if (this.ratingMin || this.ratingMax) {
                    const min = this.ratingMin || '0'
                    const max = this.ratingMax || '5'
                    query.rating = `${min},${max}`
                }

                try {
                    const response = await $fetch('/api/games', { query }) as GamesResponse
                    this.games = response.results
                    this.total = response.total
                } catch (err: any) {
                    this.error = err?.message || String(err)
                    return
                }

            } catch (e: any) {
                this.error = e.message
            } finally {
                this.loading = false
            }
        },

        resetFilters() {
            this.search = ''
            this.sort = ''
            this.platforms = ''
            this.genres = ''
            this.publishers = ''
            this.developers = ''
            this.stores = ''
            this.tags = ''
            this.dates = ''
            this.metacritic = ''
            this.ratingMin = ''
            this.ratingMax = ''
            this.page = 1
        }
    }
})
