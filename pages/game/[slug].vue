<template>
  <div class="game-page">
    <div v-if="pending" class="state">Загрузка...</div>
    <div v-else-if="error" class="state">
      Ошибка загрузки: {{ error }}
    </div>
    <div v-else-if="!game" class="state">
      Игра не найдена
    </div>

    <div v-else class="content">
      <!-- Breadcrumbs -->
      <div class="breadcrumbs">
        <NuxtLink to="/catalog" class="breadcrumb-link">Все игры</NuxtLink>
        <span class="breadcrumb-separator">></span>
        <NuxtLink 
            v-if="game.genres && game.genres.length > 0" 
            :to="`/catalog?genres=${game.genres[0].id}`" 
            class="breadcrumb-link"
        >
          {{ game.genres[0].name }}
        </NuxtLink>
        <span v-if="game.genres && game.genres.length > 0" class="breadcrumb-separator">></span>
        <span class="breadcrumb-current">{{ game.name }}</span>
      </div>

      <div class="top">
        <div class="poster">
          <!-- Видео трейлер или основное изображение -->
          <div class="main-media">
            <div v-if="showVideo && game.trailer" class="video-container">
              <video
                  v-if="game.trailer"
                  :src="game.trailer"
                  controls
                  autoplay
                  class="trailer-video"
              ></video>
              <button class="close-video-btn" @click="showVideo = false">✕</button>
            </div>
            <div v-else class="image-container">
              <img
                  v-if="selectedImage"
                  :src="selectedImage"
                  :alt="game.name"
                  class="poster-img"
                  @click="openImageModal"
              />
              <img
                  v-else-if="game.backgroundImage"
                  :src="game.backgroundImage"
                  :alt="game.name"
                  class="poster-img"
                  @click="openImageModal"
              />
              <div v-else class="poster-placeholder">Нет изображения</div>
              <button 
                  v-if="game.trailer" 
                  class="play-trailer-btn"
                  @click="showVideo = true"
              >
                ▶ Трейлер
              </button>
            </div>
          </div>
          
          <!-- Галерея миниатюр -->
          <div v-if="allImages.length > 0" class="screenshots-thumbnails">
            <div
                v-for="(image, index) in allImages.slice(0, 8)"
                :key="index"
                class="thumbnail-wrapper"
                :class="{ active: selectedImageIndex === index }"
                @click="selectImage(index)"
            >
              <img
                  :src="image"
                  :alt="`Image ${index + 1}`"
                  class="screenshot-thumb"
              />
            </div>
          </div>
        </div>

        <div class="info">
          <h1 class="title">{{ game.name }}</h1>

          <p class="description">{{ game.description }}</p>

          <div class="details">
            <div v-if="game.rating !== null && game.rating !== undefined" class="detail-row">
              <span class="detail-label">РЕЙТИНГ:</span>
              <span class="detail-value rating-value">
                <span class="rating-stars-inline">
                  <span
                      v-for="i in 5"
                      :key="i"
                      class="star-inline"
                      :class="{ filled: i <= Math.round(game.rating) }"
                  >
                    ★
                  </span>
                </span>
                <span class="rating-number">{{ formatRating(game.rating) }}</span>
              </span>
            </div>
            <div class="detail-row">
              <span class="detail-label">ДАТА ВЫХОДА:</span>
              <span class="detail-value">{{ formatDate(game.released) }}</span>
            </div>
            <div v-if="game.developer" class="detail-row">
              <span class="detail-label">РАЗРАБОТЧИК:</span>
              <span class="detail-value">{{ game.developer }}</span>
            </div>
            <div v-if="game.publisher" class="detail-row">
              <span class="detail-label">ИЗДАТЕЛЬ:</span>
              <span class="detail-value">{{ game.publisher }}</span>
            </div>
            <div v-if="game.website" class="detail-row">
              <span class="detail-label">ОФИЦИАЛЬНЫЙ САЙТ:</span>
              <span class="detail-value">
                <a 
                    :href="game.website" 
                    target="_blank"
                    rel="noopener noreferrer"
                    class="website-link"
                >
                  {{ game.website }}
                </a>
              </span>
            </div>
          </div>

          <div v-if="game.genres && game.genres.length > 0" class="tags-section">
            <div class="tags-label">Популярные метки для этого продукта:</div>
            <div class="tags-list">
              <span
                  v-for="genre in game.genres"
                  :key="genre.id"
                  class="tag-item"
              >
                {{ genre.name }}
              </span>
            </div>
          </div>

          <!-- Список магазинов с ценами -->
          <div v-if="hasStores" class="stores-section">
            <h3 class="stores-title">Где купить:</h3>
            <div class="stores-list">
              <div
                  v-for="(store, index) in allStores"
                  :key="store.storeID || index"
                  class="store-item"
                  :class="{ active: selectedStoreIndex === index, 'has-link': store.storeURL }"
                  @click="selectStore(store, index)"
              >
                <div class="store-radio">
                  <input
                      type="radio"
                      :id="`store-${index}`"
                      :value="index"
                      v-model="selectedStoreIndex"
                      class="store-radio-input"
                  />
                  <label :for="`store-${index}`" class="store-radio-label"></label>
                </div>
                <div class="store-info">
                  <div class="store-name">{{ store.storeName }}</div>
                  <div class="store-price">
                    <span class="store-price-current">{{ formatPrice(store.price) }}</span>
                    <span v-if="store.originalPrice && store.originalPrice > store.price" class="store-price-original">
                      {{ formatPrice(store.originalPrice) }}
                    </span>
                    <span v-if="store.discount" class="store-discount">-{{ store.discount }}%</span>
                  </div>
                </div>
                <div v-if="store.storeURL" class="store-link-indicator">→</div>
              </div>
            </div>
            
            <!-- Кнопка покупки и ссылка на магазин -->
            <div v-if="selectedStore && selectedStore.storeURL" class="purchase-section">
              <a
                  :href="selectedStore.storeURL"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="buy-button"
              >
                Купить в {{ selectedStore.storeName }} за {{ formatPrice(selectedStore.price) }}
              </a>
              <button 
                  class="cart-button"
                  @click="addToCart(game)"
              >
                <span v-if="gameShopStore.isInCart(game.id)">✓</span>
                <span v-else>🛒</span>
              </button>
            </div>
            <div v-else-if="selectedStore" class="purchase-section">
              <button 
                  class="buy-button"
                  @click="handleBuy"
              >
                Купить {{ formatPrice(selectedStore.price) }}
              </button>
              <button 
                  class="cart-button"
                  @click="addToCart(game)"
              >
                <span v-if="gameShopStore.isInCart(game.id)">✓</span>
                <span v-else>🛒</span>
              </button>
            </div>
          </div>
          
          <!-- Если нет списка магазинов, но есть цена -->
          <div v-else-if="currentPrice !== null && currentPrice !== undefined && currentPrice > 0" class="purchase-section">
            <button 
                class="buy-button"
                @click="handleBuy"
            >
              Купить {{ formatPrice(currentPrice) }}
            </button>
            <button 
                class="cart-button"
                @click="addToCart(game)"
            >
              <span v-if="gameShopStore.isInCart(game.id)">✓</span>
              <span v-else>🛒</span>
            </button>
          </div>
          
          <!-- Если есть только storeURL без списка магазинов -->
          <div v-else-if="game.storeURL" class="purchase-section">
            <a 
                :href="game.storeURL" 
                target="_blank"
                rel="noopener noreferrer"
                class="buy-button"
            >
              Перейти в {{ game.storeName || 'магазин' }}
            </a>
          </div>
        </div>
      </div>

      <div class="divider"></div>

      <div class="section">
        <h2 class="section-title">Описание</h2>
        <div class="description" v-html="safeDescription"></div>
      </div>

      <!-- Модальное окно для просмотра изображения -->
      <div v-if="imageModalOpen" class="image-modal" @click="closeImageModal">
        <div class="image-modal-content" @click.stop>
          <button class="modal-close-btn" @click="closeImageModal">✕</button>
          <img
              :src="selectedImage"
              :alt="game.name"
              class="modal-image"
          />
          <div class="modal-navigation">
            <button
                class="modal-nav-btn prev"
                @click="selectedImageIndex = selectedImageIndex > 0 ? selectedImageIndex - 1 : allImages.length - 1"
            >
              ‹
            </button>
            <button
                class="modal-nav-btn next"
                @click="selectedImageIndex = selectedImageIndex < allImages.length - 1 ? selectedImageIndex + 1 : 0"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      <!-- Отзывы -->
      <div v-if="!reviewsLoading && reviews.length > 0" class="section reviews-section">
        <h2 class="section-title">Отзывы</h2>
        <div v-if="reviewsLoading" class="loading">Загрузка отзывов...</div>
        <div v-else-if="reviews.length > 0" class="reviews-list">
          <div
              v-for="review in displayedReviews"
              :key="review.id"
              class="review-card"
          >
            <div class="review-header">
              <div class="review-user">
                <div class="user-avatar">{{ getUserInitial(review.user) }}</div>
                <div class="user-info">
                  <div class="user-name">{{ review.user }}</div>
                  <div class="review-date">{{ formatDate(review.date) }}</div>
                </div>
              </div>
              <div v-if="review.rating !== null" class="review-rating">
                <span class="rating-label">Оценка:</span>
                <div class="rating-stars">
                  <span
                      v-for="i in 5"
                      :key="i"
                      class="star"
                      :class="{ filled: review.rating !== null && i <= review.rating }"
                  >
                    ★
                  </span>
                </div>
              </div>
            </div>
            <div 
                class="review-text-wrapper"
                :class="{ expanded: expandedReviews.has(review.id) }"
            >
              <div 
                  ref="reviewTextRefs"
                  :data-review-id="review.id"
                  class="review-text" 
                  v-html="review.text"
              ></div>
            </div>
            <button
                v-if="needsExpandButton(review.id)"
                class="expand-button"
                @click="toggleReview(review.id)"
            >
              {{ expandedReviews.has(review.id) ? 'Свернуть' : 'Развернуть' }}
            </button>
            <div v-if="review.helpfulCount > 0" class="review-helpful">
              Полезно: {{ review.helpfulCount }}
            </div>
          </div>
        </div>
        <div v-if="!showAllReviews && reviews.length > 3" class="reviews-more">
          <button class="btn btn-outlined" @click="showAllReviews = true">
            Показать все отзывы ({{ reviews.length }})
          </button>
        </div>
        <div v-if="showAllReviews && reviewsTotal > reviews.length" class="reviews-more">
          <button class="btn btn-outlined" @click="loadMoreReviews">
            Показать еще отзывы ({{ reviewsTotal - reviews.length }})
          </button>
        </div>
        <div v-else-if="!reviewsLoading && reviews.length === 0" class="empty-state">
          Отзывов пока нет
        </div>
      </div>

      <!-- Вкладки с дополнительным контентом -->
      <div v-if="tabs.length > 0" class="section tabs-section">
        <div class="tabs">
          <button
              v-for="tab in tabs"
              :key="tab.id"
              class="tab-btn"
              :class="{ active: activeTab === tab.id }"
              @click="activeTab = tab.id"
          >
            {{ tab.label }}
            <span v-if="tab.count > 0" class="tab-count">({{ tab.count }})</span>
          </button>
        </div>

        <div class="tab-content">
          <!-- DLC -->
          <div v-if="activeTab === 'dlc'" class="tab-panel">
            <div v-if="dlcLoading" class="loading">Загрузка...</div>
            <div v-else-if="filteredDlcGames.length > 0" class="games-grid">
              <GameCard
                  v-for="dlcGame in filteredDlcGames"
                  :key="dlcGame.id"
                  :game="dlcGame"
              />
            </div>
            <div v-else class="empty-state">DLC к этой игре не найдено</div>
          </div>

          <!-- Похожие игры -->
          <div v-if="activeTab === 'similar'" class="tab-panel">
            <div v-if="similarLoading" class="loading">Загрузка...</div>
            <div v-else-if="filteredSimilarGames.length > 0" class="games-grid">
              <GameCard
                  v-for="similarGame in filteredSimilarGames"
                  :key="similarGame.id"
                  :game="similarGame"
              />
            </div>
            <div v-else class="empty-state">Похожие игры не найдены</div>
          </div>

          <!-- Игры из серии -->
          <div v-if="activeTab === 'series'" class="tab-panel">
            <div v-if="seriesLoading" class="loading">Загрузка...</div>
            <div v-else-if="filteredSeriesGames.length > 0" class="games-grid">
              <GameCard
                  v-for="seriesGame in filteredSeriesGames"
                  :key="seriesGame.id"
                  :game="seriesGame"
              />
            </div>
            <div v-else class="empty-state">Игры из этой серии не найдены</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import GameCard from '~/components/Home/GameCard.vue'
import { useGameShopStore } from '~/stores/GameShop'

interface StoreOption {
  storeID: string
  storeName: string
  price: number
  originalPrice?: number
  discount?: number
  dealID?: string
  storeURL?: string
}

interface GameDetails {
  id: number
  slug: string
  name: string
  released: string | null
  rating: number
  backgroundImage: string | null
  platforms: string[]
  genres?: Array<{ id: number; name: string; slug: string }>
  developer?: string | null
  publisher?: string | null
  price?: number | null
  description: string
  website: string | null
  screenshots: string[]
  gameSeries?: { id: number; name: string; slug: string } | null
  isDLC?: boolean
  parentGame?: { id: number; name: string; slug: string } | null
  storeName?: string
  storeURL?: string
  stores?: StoreOption[]
  priceSource?: 'cheapshark' | 'generated' | 'console_store' | null
  priceNote?: string | null
  originalPrice?: number
  discount?: number
  ageRating?: string | null
  tags?: Array<{ slug: string; name: string }>
  trailer?: string | null
  trailerPreview?: string | null
}

interface Game {
  id: number
  slug: string
  name: string
  released: string
  rating: number
  backgroundImage?: string
  platforms: string[]
  genres?: Array<{ id: number; name: string; slug: string }>
  price?: number | null
  isDLC?: boolean
  storeName?: string
  storeURL?: string
  priceSource?: 'cheapshark' | 'generated' | 'console_store'
  ageRating?: string | null
  tags?: Array<{ slug: string; name: string }>
}

const route = useRoute()

const { data, pending, error } = await useFetch<{ game: GameDetails }>(
    `/api/games/${route.params.slug}`,
    { 
      watch: [() => route.params.slug]
    }
)

const game = computed(() => {
  if (!data.value) return null
  // Проверяем структуру ответа - API возвращает { game: {...} }
  if (data.value && typeof data.value === 'object' && 'game' in data.value) {
    return (data.value as { game: GameDetails }).game
  }
  return null
})

// минимальная защита: убираем null/undefined, оставляем строку
const safeDescription = computed(() => (game.value?.description || '').trim())

// Видео и изображения
const showVideo = ref(false)
const selectedImageIndex = ref(0)
const imageModalOpen = ref(false)

// Все изображения для галереи
const allImages = computed(() => {
  if (!game.value) return []
  const images: string[] = []
  if (game.value.backgroundImage) {
    images.push(game.value.backgroundImage)
  }
  if (game.value.screenshots && game.value.screenshots.length > 0) {
    images.push(...game.value.screenshots)
  }
  return images
})

// Выбранное изображение
const selectedImage = computed(() => {
  if (allImages.value.length === 0) return undefined
  const img = allImages.value[selectedImageIndex.value] || allImages.value[0]
  return img || undefined
})

const selectImage = (index: number) => {
  selectedImageIndex.value = index
  showVideo.value = false
}

const openImageModal = () => {
  imageModalOpen.value = true
}

const closeImageModal = () => {
  imageModalOpen.value = false
}

const currentScreenshotIndex = ref(0)

const nextScreenshot = () => {
  if (game.value?.screenshots && currentScreenshotIndex.value < game.value.screenshots.length - 1) {
    currentScreenshotIndex.value++
  }
}

const prevScreenshot = () => {
  if (currentScreenshotIndex.value > 0) {
    currentScreenshotIndex.value--
  }
}

watch(() => game.value?.screenshots, () => {
  currentScreenshotIndex.value = 0
})

const formatDate = (value: string | null) => {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('ru-RU')
}

const formatRating = (rating: number | null | undefined) => {
  if (typeof rating !== 'number' || rating === null || rating === undefined) {
    return '—'
  }
  return rating.toFixed(1)
}

const formatPrice = (price?: number | null) => {
  if (typeof price !== 'number' || price === null || price === undefined || price <= 0) {
    return '—'
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price)
}

const gameShopStore = useGameShopStore()

// Выбранный магазин
const selectedStoreIndex = ref<number>(0)

// Проверяем, есть ли магазины с ценами
const hasStores = computed(() => {
  // Если есть массив stores с хотя бы одним элементом
  if (game.value?.stores && game.value.stores.length > 0) {
    return true
  }
  // Если есть цена и storeURL (один магазин)
  if (game.value?.price && game.value.price > 0 && game.value.storeURL) {
    return true
  }
  return false
})

// Получаем список всех магазинов (из массива или создаем из одного магазина)
const allStores = computed(() => {
  if (game.value?.stores && game.value.stores.length > 0) {
    return game.value.stores
  }
  // Если есть цена и storeURL, создаем один магазин
  if (game.value?.price && game.value.price > 0 && game.value.storeURL) {
    return [{
      storeID: 'single',
      storeName: game.value.storeName || 'Магазин',
      price: game.value.price,
      originalPrice: game.value.originalPrice,
      discount: game.value.discount,
      storeURL: game.value.storeURL
    }]
  }
  return []
})

// Инициализируем выбранный магазин при загрузке игры
watch(() => allStores.value, (stores) => {
  if (stores && stores.length > 0) {
    selectedStoreIndex.value = 0
  }
}, { immediate: true })

// Вычисляем выбранный магазин
const selectedStore = computed(() => {
  if (allStores.value && allStores.value.length > 0) {
    const index = Math.min(selectedStoreIndex.value, allStores.value.length - 1)
    return allStores.value[index] || allStores.value[0]
  }
  return null
})

// Обновляем цену при изменении магазина
const currentPrice = computed(() => {
  if (selectedStore.value) {
    return selectedStore.value.price
  }
  return game.value?.price ?? null
})

// Обновляем storeName при изменении магазина
const currentStoreName = computed(() => {
  if (selectedStore.value) {
    return selectedStore.value.storeName
  }
  return game.value?.storeName
})

// Обработчик изменения магазина
watch(selectedStoreIndex, () => {
  onStoreChange()
})

const onStoreChange = () => {
  // Обновляем цену игры при изменении магазина
  if (game.value && selectedStore.value) {
    game.value.price = selectedStore.value.price
    game.value.storeName = selectedStore.value.storeName
  }
}

// Выбор магазина
const selectStore = (store: StoreOption, index: number) => {
  selectedStoreIndex.value = index
}

const addToCart = (g: GameDetails) => {
  // Не добавляем в корзину если цена неизвестна или равна 0
  const effectivePrice = selectedStore.value ? selectedStore.value.price : g.price
  if (typeof effectivePrice !== 'number' || effectivePrice === null || effectivePrice === undefined || effectivePrice <= 0) {
    return
  }

  const storeToAdd: StoreOption = selectedStore.value || 
    (g.stores && g.stores.length > 0 ? g.stores[0] as StoreOption : { storeID: '', storeName: g.storeName || '', price: effectivePrice })

  gameShopStore.addToCart({
    id: g.id,
    slug: g.slug,
    name: g.name,
    price: storeToAdd.price,
    backgroundImage: g.backgroundImage,
    platforms: g.platforms,
    storeName: storeToAdd.storeName,
    storeURL: storeToAdd.storeURL
  })
}

const handleBuy = () => {
  // Если есть ссылка на магазин, открываем её
  if (selectedStore.value?.storeURL) {
    window.open(selectedStore.value.storeURL, '_blank', 'noopener,noreferrer')
  } else if (game.value?.storeURL) {
    window.open(game.value.storeURL, '_blank', 'noopener,noreferrer')
  } else {
    // TODO: Открыть модальное окно оплаты
    console.log('Open payment modal')
  }
}

const formattedCurrentPrice = computed(() => {
  return typeof currentPrice.value === 'number' ? formatPrice(currentPrice.value) : null
})

// Вкладки
const activeTab = ref('dlc')

// DLC
const dlcGames = ref<Game[]>([])
const dlcLoading = ref(false)

// Похожие игры
const similarGames = ref<Game[]>([])
const similarLoading = ref(false)

// Игры из серии
const seriesGames = ref<Game[]>([])
const seriesLoading = ref(false)

// Отзывы
interface Review {
  id: number
  user: string
  rating: number | null
  text: string
  date: string
  helpfulCount: number
}

const reviews = ref<Review[]>([])
const reviewsLoading = ref(false)
const reviewsTotal = ref(0)
const reviewsPage = ref(1)
const reviewsPageSize = 10

// Состояние развернутых отзывов
const expandedReviews = ref<Set<number>>(new Set())
const reviewNeedsExpand = ref<Map<number, boolean>>(new Map())

// Показывать все отзывы или только первые 3
const showAllReviews = ref(false)

// Отображаемые отзывы (первые 3 или все)
const displayedReviews = computed(() => {
  if (showAllReviews.value) {
    return reviews.value
  }
  return reviews.value.slice(0, 3)
})

// Загружаем отзывы
const loadReviews = async (page: number = 1) => {
  if (!game.value) return
  
  reviewsLoading.value = true
  try {
    const { data: reviewsData } = await useFetch<{ results: Review[]; count: number }>(
      `/api/games/${game.value.slug}/reviews`,
      {
        query: {
          page,
          pageSize: reviewsPageSize
        }
      }
    )
    
    if (reviewsData.value) {
      if (page === 1) {
        reviews.value = reviewsData.value.results
      } else {
        reviews.value.push(...reviewsData.value.results)
      }
      reviewsTotal.value = reviewsData.value.count
      reviewsPage.value = page
    }
  } catch (e) {
    console.error('Error loading reviews:', e)
  } finally {
    reviewsLoading.value = false
  }
}

const loadMoreReviews = () => {
  loadReviews(reviewsPage.value + 1)
}

// Безопасное получение первой буквы имени пользователя
const getUserInitial = (user: string | null | undefined): string => {
  if (!user || typeof user !== 'string') return '?'
  return user.charAt(0).toUpperCase()
}

// Переключение состояния отзыва (развернуть/свернуть)
const toggleReview = (reviewId: number) => {
  if (expandedReviews.value.has(reviewId)) {
    expandedReviews.value.delete(reviewId)
  } else {
    expandedReviews.value.add(reviewId)
  }
  // Пересчитываем высоту после изменения состояния
  nextTick(() => {
    if (process.client) measureReviewHeights()
  })
}

// Проверка, нужна ли кнопка "Развернуть"
const needsExpandButton = (reviewId: number): boolean => {
  return reviewNeedsExpand.value.get(reviewId) ?? false
}

// Измерение высоты отзывов после загрузки
const measureReviewHeights = () => {
  // Защищаемся от выполнения на сервере или в среде без DOM
  if (typeof document === 'undefined' || !process.client) return

  // Используем double nextTick и requestAnimationFrame на клиенте
  nextTick(() => {
    const runMeasure = () => {
      nextTick(() => {
        try {
          const reviewElements = document.querySelectorAll('[data-review-id]')
          if (!reviewElements || typeof reviewElements.forEach !== 'function') return

          reviewElements.forEach((el) => {
            if (!(el instanceof Element)) return
            const idAttr = el.getAttribute('data-review-id')
            const reviewId = Number(idAttr)
            if (!reviewId) return

            const htmlEl = el as HTMLElement
            const needsExpand = htmlEl.scrollHeight > htmlEl.clientHeight + 5 // +5 для учета погрешности
            reviewNeedsExpand.value.set(reviewId, needsExpand)
          })
        } catch (e) {
          // Предохраняемся от неожиданных ошибок измерения
          // Логируем, но не ломаем приложение
          // eslint-disable-next-line no-console
          console.warn('measureReviewHeights failed:', e)
        }
      })
    }

    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(runMeasure)
    } else {
      runMeasure()
    }
  })
}

// Загружаем данные для вкладок
const loadTabData = async () => {
  if (!game.value) return

  // Загружаем DLC
  dlcLoading.value = true
  try {
    const { data: dlcData } = await useFetch<{ results: Game[]; count: number }>(
      `/api/games/${game.value.slug}/dlc`
    )
    const allDlc = dlcData.value?.results || []
    // Сохраняем все DLC, фильтрация будет применена в computed
    dlcGames.value = allDlc
  } catch (e) {
    dlcGames.value = []
  } finally {
    dlcLoading.value = false
  }

  // Загружаем похожие игры
  similarLoading.value = true
  try {
    const { data: similarData } = await useFetch<{ results: Game[]; count: number }>(
      `/api/games/${game.value.slug}/similar`
    )
    const allSimilar = similarData.value?.results || []
    // Сохраняем все похожие игры, фильтрация будет применена в computed
    similarGames.value = allSimilar
  } catch (e) {
    similarGames.value = []
  } finally {
    similarLoading.value = false
  }

  // Загружаем игры из серии
  seriesLoading.value = true
  try {
    const { data: seriesData } = await useFetch<{ results: Game[]; count: number }>(
      `/api/games/${game.value.slug}/series`
    )
    const allSeries = seriesData.value?.results || []
    // Сохраняем все игры из серии, фильтрация будет применена в computed
    seriesGames.value = allSeries
  } catch (e) {
    seriesGames.value = []
  } finally {
    seriesLoading.value = false
  }
}

// Загружаем данные когда игра загрузилась
watch(() => game.value?.slug, () => {
  if (game.value) {
    loadTabData()
    loadReviews(1)
  }
}, { immediate: true })

// Измеряем высоту отзывов после их загрузки
watch(() => reviews.value, () => {
  if (process.client) measureReviewHeights()
}, { deep: true })

// Также измеряем при изменении размера окна
if (process.client) {
  window.addEventListener('resize', measureReviewHeights)
  onUnmounted(() => {
    window.removeEventListener('resize', measureReviewHeights)
  })
}

// Фильтрованные списки игр
const filteredDlcGames = computed(() => dlcGames.value)
const filteredSimilarGames = computed(() => similarGames.value)
const filteredSeriesGames = computed(() => seriesGames.value)

const tabs = computed(() => {
  const allTabs = [
    {
      id: 'dlc',
      label: 'DLC к этой игре',
      count: filteredDlcGames.value.length
    },
    {
      id: 'similar',
      label: 'Похожие игры',
      count: filteredSimilarGames.value.length
    },
    {
      id: 'series',
      label: 'Игры из этой серии',
      count: filteredSeriesGames.value.length
    }
  ]
  
  // Показываем только вкладки с данными
  return allTabs.filter(tab => tab.count > 0)
})

// Автоматически переключаемся на первую доступную вкладку, если текущая скрыта
watch(tabs, (visibleTabs) => {
  if (visibleTabs.length > 0 && !visibleTabs.some(tab => tab.id === activeTab.value)) {
    activeTab.value = visibleTabs[0].id
  }
}, { immediate: true })
</script>

<style scoped lang="scss">
.game-page {
  padding: 24px 0;
}

.state {
  padding: 24px;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.breadcrumbs {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #666;
  margin-bottom: 24px;
  flex-wrap: wrap;
  padding: 0 20px;
}

.breadcrumb-link {
  color: #666;
  text-decoration: none;
  transition: all 0.2s ease;
  font-weight: 400;
  padding: 4px 0;
  position: relative;
}

.breadcrumb-link::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 1px;
  background-color: #1976d2;
  transition: width 0.2s ease;
}

.breadcrumb-link:hover {
  color: #1976d2;
}

.breadcrumb-link:hover::after {
  width: 100%;
}

.breadcrumb-separator {
  color: #ccc;
  margin: 0 2px;
  font-weight: 300;
  font-size: 12px;
  user-select: none;
}

.breadcrumb-current {
  color: #333;
  font-weight: 500;
  max-width: 500px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 4px 0;
}

.top {
  display: grid;
  grid-template-columns: 600px 1fr;
  gap: 24px;
}

.main-media {
  position: relative;
  width: 100%;
  margin-bottom: 16px;
}

.image-container {
  position: relative;
  width: 100%;
  cursor: pointer;
}

.poster-img {
  width: 100%;
  height: 500px;
  object-fit: contain;
  border-radius: 8px;
  overflow: hidden;
  background: #d3d3d3;
  transition: transform 0.2s;
}

.poster-img:hover {
  transform: scale(1.02);
}

.play-trailer-btn {
  position: absolute;
  bottom: 20px;
  left: 20px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  border-radius: 6px;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background 0.2s;
  z-index: 10;
}

.play-trailer-btn:hover {
  background: rgba(0, 0, 0, 0.9);
}

.video-container {
  position: relative;
  width: 100%;
  height: 500px;
  border-radius: 8px;
  overflow: hidden;
  background: #000;
}

.trailer-video {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #000;
}

.close-video-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  z-index: 10;
}

.close-video-btn:hover {
  background: rgba(0, 0, 0, 0.9);
}

.screenshots-thumbnails {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 16px;
}

.thumbnail-wrapper {
  position: relative;
  cursor: pointer;
  border-radius: 6px;
  overflow: hidden;
  border: 3px solid transparent;
  transition: all 0.2s;
}

.thumbnail-wrapper:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.thumbnail-wrapper.active {
  border-color: #1976d2;
  box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.3);
}

.screenshot-thumb {
  width: 100px;
  height: 75px;
  object-fit: cover;
  display: block;
}

.image-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  cursor: pointer;
}

.image-modal-content {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-image {
  max-width: 100%;
  max-height: 90vh;
  object-fit: contain;
  border-radius: 8px;
}

.modal-close-btn {
  position: absolute;
  top: -50px;
  right: 0;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.modal-close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.modal-navigation {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 100%;
  display: flex;
  justify-content: space-between;
  pointer-events: none;
}

.modal-nav-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  font-size: 32px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  pointer-events: all;
  margin: 0 20px;
}

.modal-nav-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.modal-nav-btn.prev {
  left: 0;
}

.modal-nav-btn.next {
  right: 0;
}

.title {
  font-size: 28px;
  font-weight: 600;
  margin: 0 0 16px;
  color: #000;
}

.description {
  font-size: 14px;
  line-height: 1.6;
  color: #333;
  margin-bottom: 20px;
}

.details {
  margin-bottom: 20px;
}

.detail-row {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
  font-size: 14px;
}

.detail-label {
  font-weight: 600;
  color: #000;
  min-width: 120px;
}

.detail-value {
  color: #666;
}

.website-link {
  color: #1976d2;
  text-decoration: none;
  transition: color 0.2s;
  word-break: break-all;
}

.website-link:hover {
  color: #1565c0;
  text-decoration: underline;
}

.rating-value {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rating-stars-inline {
  display: flex;
  gap: 2px;
  align-items: center;
}

.star-inline {
  color: #ddd;
  font-size: 16px;
  line-height: 1;
}

.star-inline.filled {
  color: #ffc107;
}

.rating-number {
  font-weight: 600;
  color: #333;
}

.rating-value {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rating-stars-inline {
  display: flex;
  gap: 2px;
  align-items: center;
}

.star-inline {
  color: #ddd;
  font-size: 16px;
  line-height: 1;
}

.star-inline.filled {
  color: #ffc107;
}

.rating-number {
  font-weight: 600;
  color: #333;
}

.tags-section {
  margin-bottom: 24px;
}

.tags-label {
  font-size: 14px;
  font-weight: 600;
  color: #000;
  margin-bottom: 8px;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-item {
  font-size: 13px;
  color: #000;
  background: #f0f0f0;
  padding: 6px 12px;
  border-radius: 4px;
}

.stores-section {
  margin-top: 24px;
  padding: 20px;
  background: #f9f9f9;
  border-radius: 12px;
  border: 1px solid #e0e0e0;
}

.stores-title {
  font-size: 18px;
  font-weight: 600;
  color: #000;
  margin: 0 0 16px 0;
}

.stores-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.store-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.store-item:hover {
  border-color: #1976d2;
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.1);
}

.store-item.active {
  border-color: #1976d2;
  background: rgba(25, 118, 210, 0.05);
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.15);
}

.store-item.has-link {
  position: relative;
}

.store-item.has-link:hover {
  border-color: #1976d2;
  background: rgba(25, 118, 210, 0.05);
}

.store-link-indicator {
  font-size: 18px;
  color: #1976d2;
  font-weight: 600;
  margin-left: auto;
  opacity: 0;
  transition: opacity 0.2s, transform 0.2s;
}

.store-item.has-link:hover .store-link-indicator {
  opacity: 1;
  transform: translateX(4px);
}

.store-radio {
  position: relative;
  flex-shrink: 0;
}

.store-radio-input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
}

.store-radio-label {
  display: block;
  width: 20px;
  height: 20px;
  border: 2px solid #ccc;
  border-radius: 50%;
  position: relative;
  cursor: pointer;
  transition: all 0.2s;
}

.store-radio-input:checked + .store-radio-label {
  border-color: #1976d2;
  background: #1976d2;
}

.store-radio-input:checked + .store-radio-label::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 8px;
  height: 8px;
  background: white;
  border-radius: 50%;
}

.store-info {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.store-name {
  font-size: 16px;
  font-weight: 600;
  color: #000;
}

.store-price {
  display: flex;
  align-items: center;
  gap: 12px;
}

.store-price-current {
  font-size: 18px;
  font-weight: 700;
  color: #1976d2;
}

.store-price-original {
  font-size: 14px;
  color: #999;
  text-decoration: line-through;
}

.store-discount {
  font-size: 14px;
  font-weight: 600;
  color: #4caf50;
  background: rgba(76, 175, 80, 0.1);
  padding: 4px 8px;
  border-radius: 4px;
}

.purchase-section {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-top: 16px;
}

.buy-button {
  background: #FF8989;
  color: #FFFFFF;
  border: none;
  border-radius: 6px;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.buy-button:hover {
  background: #ff7070;
}

.cart-button {
  width: 48px;
  height: 48px;
  background: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  transition: background-color 0.2s;
}

.cart-button:hover {
  background: #e0e0e0;
}

.meta {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.meta-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.genres-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.genre-tag {
  font-size: 13px;
  color: #1976d2;
  background: rgba(25, 118, 210, 0.1);
  padding: 4px 12px;
  border-radius: 16px;
  white-space: nowrap;
  font-weight: 500;
}

.label {
  width: 80px;
  opacity: 0.7;
}

.value {
  opacity: 0.9;
}

.rating {
  display: flex;
  gap: 2px;
}

.star {
  color: #ddd;
  font-size: 18px;
  line-height: 1;
}

.star.filled {
  color: #ffc107;
}

.price-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.price-display {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.price {
  font-weight: 700;
  font-size: 18px;
  color: #1976d2;
}

.price-source {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.price-source-link {
  font-size: 14px;
  color: #1976d2;
  font-weight: 500;
  text-decoration: none;
  transition: color 0.2s;
}

.price-source-link:hover {
  color: #1565c0;
  text-decoration: underline;
}

.console-store-link {
  font-size: 16px;
  color: #1976d2;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s;
  padding: 8px 16px;
  border: 2px solid #1976d2;
  border-radius: 6px;
  display: inline-block;
}

.console-store-link:hover {
  color: #1565c0;
  border-color: #1565c0;
  background-color: rgba(25, 118, 210, 0.05);
}

.store-selector {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.store-select {
  padding: 8px 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  background: white;
  color: #333;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 300px;
}

.store-select:hover {
  border-color: #1976d2;
}

.store-select:focus {
  outline: none;
  border-color: #1976d2;
  box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.1);
}

.store-info {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}

.chip {
  background: rgba(0, 0, 0, 0.08);
  color: rgba(0, 0, 0, 0.87);
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
}

.actions {
  display: flex;
  gap: 12px;
  margin-top: 18px;
}

.btn {
  padding: 10px 24px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  text-transform: uppercase;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-primary {
  background: #1976d2;
  color: white;
}

.btn-primary:hover {
  background: #1565c0;
}

.btn-outlined {
  background: transparent;
  color: #1976d2;
  border: 1px solid #1976d2;
}

.btn-outlined:hover {
  background: rgba(25, 118, 210, 0.04);
}

.btn-success {
  background: #4caf50;
  color: white;
  text-decoration: none;
}

.btn-success:hover {
  background: #45a049;
}

.divider {
  height: 1px;
  background: rgba(0, 0, 0, 0.12);
  margin: 24px 0;
  border: none;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-title {
  margin: 0;
  font-size: 22px;
}

.description {
  line-height: 1.6;
}

.carousel {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
}

.carousel-container {
  flex: 1;
  height: 420px;
  overflow: hidden;
  border-radius: 8px;
  position: relative;
}

.carousel-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.carousel-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.12);
  background: white;
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.carousel-btn:hover:not(:disabled) {
  background: #f5f5f5;
}

.carousel-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.carousel-indicators {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
}

.indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: all 0.2s;
}

.indicator.active {
  background: white;
  width: 24px;
  border-radius: 4px;
}

.tabs-section {
  margin-top: 32px;
}

.tabs {
  display: flex;
  gap: 8px;
  border-bottom: 2px solid #e0e0e0;
  margin-bottom: 24px;
}

.tab-btn {
  padding: 12px 24px;
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  color: #666;
  transition: all 0.2s;
  position: relative;
  bottom: -2px;
}

.tab-btn:hover {
  color: #1976d2;
}

.tab-btn.active {
  color: #1976d2;
  border-bottom-color: #1976d2;
  font-weight: 600;
}

.tab-count {
  color: #999;
  font-size: 14px;
  font-weight: normal;
}

.tab-btn.active .tab-count {
  color: #1976d2;
}

.tab-content {
  min-height: 200px;
}

.tab-panel {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.games-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.loading {
  padding: 40px;
  text-align: center;
  color: #666;
}

.empty-state {
  padding: 40px;
  text-align: center;
  color: #999;
  font-style: italic;
}

.dlc-banner {
  background: linear-gradient(135deg, #7b2cbf 0%, #9d4edd 100%);
  color: white;
  padding: 20px 24px;
  border-radius: 12px;
  margin-bottom: 24px;
  box-shadow: 0 4px 12px rgba(123, 44, 191, 0.3);
}

.dlc-banner-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.dlc-banner-icon {
  font-size: 48px;
  line-height: 1;
}

.dlc-banner-text {
  flex: 1;
}

.dlc-banner-text h3 {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 700;
}

.dlc-banner-text p {
  margin: 0 0 12px 0;
  opacity: 0.9;
  font-size: 14px;
}

.parent-game-link {
  display: inline-block;
  background: white;
  color: #7b2cbf;
  padding: 10px 20px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  font-size: 16px;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.parent-game-link:hover {
  background: #f5f5f5;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}


.reviews-section {
  margin-top: 32px;
}

.reviews-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.review-card {
  background: #f5f5f5;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #e0e0e0;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  gap: 16px;
}

.review-user {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 16px;
  flex-shrink: 0;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.user-name {
  font-weight: 600;
  font-size: 16px;
  color: #333;
}

.review-date {
  font-size: 12px;
  color: #666;
}

.review-rating {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.rating-label {
  font-size: 12px;
  color: #666;
}

.rating-stars {
  display: flex;
  gap: 2px;
}

.rating-stars .star {
  color: #ddd;
  font-size: 14px;
  line-height: 1;
}

.rating-stars .star.filled {
  color: #ffc107;
}

.review-text-wrapper {
  position: relative;
  overflow: hidden;
  margin-bottom: 12px;
}

.review-text-wrapper:not(.expanded) .review-text {
  max-height: 150px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 6;
  -webkit-box-orient: vertical;
  line-clamp: 6;
}

.review-text-wrapper.expanded .review-text {
  max-height: none;
  overflow: visible;
  display: block;
}

.review-text {
  line-height: 1.6;
  color: #333;
  word-wrap: break-word;
  transition: max-height 0.3s ease;
}

.review-text :deep(div) {
  margin-bottom: 8px;
}

.review-text :deep(br) {
  display: block;
  margin-bottom: 4px;
  content: '';
}

.review-text :deep(p) {
  margin-bottom: 8px;
}

.review-text :deep(strong),
.review-text :deep(b) {
  font-weight: 600;
}

.review-text :deep(em),
.review-text :deep(i) {
  font-style: italic;
}

.expand-button {
  background: transparent;
  border: 1px solid #1976d2;
  color: #1976d2;
  padding: 6px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 12px;
  align-self: flex-start;
}

.expand-button:hover {
  background: rgba(25, 118, 210, 0.1);
  border-color: #1565c0;
  color: #1565c0;
}

.expand-button:active {
  transform: scale(0.98);
}

.review-helpful {
  font-size: 12px;
  color: #666;
  display: flex;
  align-items: center;
  gap: 4px;
}

.reviews-more {
  margin-top: 24px;
  text-align: center;
}

@media (max-width: 960px) {
  .top {
    grid-template-columns: 1fr;
  }
  
  .carousel {
    flex-direction: column;
  }
  
  .carousel-btn {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    z-index: 1;
  }
  
  .carousel-btn-prev {
    left: 12px;
  }
  
  .carousel-btn-next {
    right: 12px;
  }

  .tabs {
    flex-wrap: wrap;
  }

  .tab-btn {
    padding: 10px 16px;
    font-size: 14px;
  }

  .games-grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 16px;
    max-width: 100%;
  }

  .dlc-banner-content {
    flex-direction: column;
    text-align: center;
  }

  .dlc-banner-icon {
    font-size: 36px;
  }

  .review-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .review-rating {
    align-self: flex-start;
  }

  .stores-section {
    padding: 16px;
  }

  .store-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .store-price {
    width: 100%;
    justify-content: flex-start;
  }

  .purchase-section {
    flex-direction: column;
    width: 100%;
  }

  .buy-button {
    width: 100%;
    text-align: center;
  }
}
</style>
