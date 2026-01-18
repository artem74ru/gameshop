<template>
  <div class="home">

    <!-- Большой герой-блок -->
    <HeroBig v-if="featuredGames.length > 0" :games="featuredGames" />

    <!-- Категории -->
    <CategoryList :categories="categories" />

    <!-- Издатели -->
    <PublisherList v-if="publishers.length > 0" :publishers="publishers" />

    <!-- Блоки подборок -->
    <GameCarousel
        title="Популярное"
        :games="popularGames"
    />

    <GameCarousel
        title="Новинки"
        :games="newGames"
    />

    <GameCarousel
        title="Рекомендуем"
        :games="recommendedGames"
    />
  </div>
</template>

<script setup lang="ts">
import HeroBig from '~/components/Home/HeroBig.vue'
import CategoryList from '~/components/Home/CategoryList.vue'
import GameCarousel from '~/components/Home/GameCarousel.vue'
import PublisherList from '~/components/Home/PublisherList.vue'

// Загружаем жанры для категорий
const { data: genresData } = await useFetch('/api/genres', { server: true })
const genres = computed(() => genresData.value?.results || [])

// Берем первые 11 популярных жанров для категорий (12-я будет ссылка на каталог)
const categories = computed(() => genres.value.slice(0, 11))

// Загружаем издателей
const { data: publishersData } = await useFetch('/api/publishers', { server: true })
const publishers = computed(() => (publishersData.value?.results || []).slice(0, 20))

// Загружаем разные подборки игр
const currentYear = new Date().getFullYear()
const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0')
const currentDay = String(new Date().getDate()).padStart(2, '0')
const lastYear = `${currentYear - 1}-01-01,${currentYear}-${currentMonth}-${currentDay}`

interface Game {
  id: number
  slug: string
  name: string
  released: string
  rating: number
  backgroundImage?: string | null
  platforms: string[]
  genres?: Array<{ id: number; name: string; slug: string }>
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
  isDLC?: boolean
  ageRating?: string | null
  tags?: Array<{ slug: string; name: string }>
}

// Функция для фильтрации игр с изображениями
// Проверяет наличие изображения и возвращает только игры с валидными изображениями
const filterGamesWithImages = (games: Game[], count: number): Game[] => {
  if (!games || games.length === 0) return []
  
  const gamesWithImages: Game[] = []
  
  for (const game of games) {
    // Проверяем наличие изображения
    if (game.backgroundImage && 
        typeof game.backgroundImage === 'string' &&
        game.backgroundImage.trim() !== '' && 
        !game.backgroundImage.includes('null') &&
        game.backgroundImage !== 'undefined') {
      gamesWithImages.push(game)
      
      // Если набрали нужное количество, прекращаем поиск
      if (gamesWithImages.length >= count) {
        break
      }
    }
  }
  
  return gamesWithImages
}

// Рекомендуем - самые популярные игры по версии RAWG API
// Используем сортировку по рейтингу (самые популярные)
const { data: recommendedData } = await useFetch('/api/games', {
  query: {
    page: 1,
    pageSize: 15, // Загружаем больше, чтобы после фильтрации осталось 8
    sort: 'rating_desc'
  },
  server: true
})

const recommendedGames = computed(() => {
  const games = (recommendedData.value?.results || []) as Game[]
  return filterGamesWithImages(games, 8)
})

// Новинки - самые популярные игры за последний год по версии RAWG API
// Фильтруем за последний год и сортируем по рейтингу (популярности)
const { data: newGamesData } = await useFetch('/api/games', {
  query: {
    page: 1,
    pageSize: 15, // Загружаем больше, чтобы после фильтрации осталось 8
    sort: 'rating_desc', // Сортируем по популярности (рейтингу)
    dates: lastYear // Фильтруем за последний год
  },
  server: true
})

const newGames = computed(() => {
  const games = (newGamesData.value?.results || []) as Game[]
  return filterGamesWithImages(games, 8)
})

// Популярное - самые популярные игры, но не те, что уже в "Рекомендуем"
// Загружаем больше популярных игр и исключаем те, что уже в recommendedGames
const { data: popularData } = await useFetch('/api/games', {
  query: {
    page: 1,
    pageSize: 20, // Загружаем больше, чтобы после фильтрации осталось 8
    sort: 'rating_desc'
  },
  server: true
})

const popularGames = computed(() => {
  const games = (popularData.value?.results || []) as Game[]
  const recommendedIds = new Set(recommendedGames.value.map(g => g.id))
  
  // Исключаем игры, которые уже в "Рекомендуем"
  const filteredGames = games.filter(game => !recommendedIds.has(game.id))
  
  return filterGamesWithImages(filteredGames, 8)
})

// Featured games - первые 5 из рекомендуемых для карусели
const featuredGames = computed(() => recommendedGames.value.slice(0, 5))
</script>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding: 24px 0;
}
</style>
