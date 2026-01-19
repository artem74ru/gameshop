<template>
  <div class="game-page">
    <SkeletonGameDetail v-if="pending" />
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

          <!-- Список магазинов с ценами (только если есть дата релиза) -->
          <div v-if="hasReleaseDate && hasStores" class="stores-section">
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
            
            <!-- Кнопка покупки и ссылка на магазин (только если есть дата релиза) -->
            <div v-if="hasReleaseDate && selectedStore && selectedStore.storeURL" class="purchase-section">
              <button
                  class="buy-button"
                  :class="{ 'in-cart': gameShopStore.isInCart(game.id) }"
                  @click="handleBuyAndAddToCart"
                  :disabled="!canAddToCart"
              >
                <span v-if="gameShopStore.isInCart(game.id)" class="buy-button-content">
                  <span class="buy-check-icon">✓ В корзине</span>
                  <span class="buy-remove-text">Удалить</span>
                </span>
                <span v-else>Купить в {{ selectedStore.storeName }} за {{ formatPrice(selectedStore.price) }}</span>
              </button>
            </div>
            <div v-else-if="hasReleaseDate && selectedStore" class="purchase-section">
              <button 
                  class="buy-button"
                  :class="{ 'in-cart': gameShopStore.isInCart(game.id) }"
                  :disabled="!canAddToCart"
                  @click="handleBuyToggle"
              >
                <span v-if="gameShopStore.isInCart(game.id)" class="buy-button-content">
                  <span class="buy-check-icon">✓ В корзине</span>
                  <span class="buy-remove-text">Удалить</span>
                </span>
                <span v-else>Купить {{ formatPrice(selectedStore.price) }}</span>
              </button>
            </div>
          </div>
          
          <!-- Если нет списка магазинов, но есть цена (только если есть дата релиза) -->
          <div v-else-if="hasReleaseDate && currentPrice !== null && currentPrice !== undefined && currentPrice > 0" class="purchase-section">
            <button 
                class="buy-button"
                :class="{ 'in-cart': gameShopStore.isInCart(game.id) }"
                :disabled="!canAddToCart"
                @click="handleBuyToggle"
            >
              <span v-if="gameShopStore.isInCart(game.id)" class="buy-button-content">
                <span class="buy-check-icon">✓ В корзине</span>
                <span class="buy-remove-text">Удалить</span>
              </span>
              <span v-else>Купить {{ formatPrice(currentPrice) }}</span>
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

      <!-- Сравнение цен из разных магазинов (только если есть дата релиза и есть цены) -->
      <div v-if="hasReleaseDate && priceComparisonsLoading" class="section price-comparison-section">
        <h2 class="section-title">Сравнение цен</h2>
        <div class="price-comparison-grid">
          <SkeletonPriceCard v-for="i in 3" :key="`skeleton-price-${i}`" />
        </div>
      </div>
      <div v-else-if="hasReleaseDate && priceComparisons.length > 0" class="section price-comparison-section">
        <h2 class="section-title">Сравнение цен</h2>
        <div class="price-comparison-grid">
          <div
              v-for="(price, index) in priceComparisons"
              :key="price.dealID || index"
              class="price-comparison-card"
              :class="{ 'best-price': index === 0 }"
          >
            <div class="price-card-header">
              <h3 class="store-name">{{ price.storeName }}</h3>
              <span v-if="index === 0 && price.price > 0" class="best-price-badge">Лучшая цена</span>
            </div>
            <div class="price-card-body">
              <div v-if="price.price > 0" class="price-main">
                <span class="price-value">{{ formatPrice(price.price) }}</span>
                <span v-if="price.originalPrice && price.originalPrice > price.price" class="price-original">
                  {{ formatPrice(price.originalPrice) }}
                </span>
              </div>
              <div v-else class="price-unavailable">
                <span class="price-unavailable-text">Цена недоступна</span>
              </div>
              <div v-if="price.discount > 0 && price.price > 0" class="price-discount">
                Скидка {{ Math.round(price.discount) }}%
              </div>
              <div v-if="price.dealRating" class="price-rating">
                Рейтинг: {{ parseFloat(price.dealRating).toFixed(1) }}/10
              </div>
            </div>
            <a
                v-if="price.storeURL"
                :href="price.storeURL"
                target="_blank"
                rel="noopener noreferrer"
                class="price-buy-button"
            >
              {{ price.price > 0 ? 'Купить' : 'Перейти в магазин' }}
            </a>
            <div v-else class="price-buy-button price-buy-button-disabled">
              Ссылка недоступна
            </div>
          </div>
        </div>
      </div>

      <div class="divider"></div>

      <div class="section">
        <h2 class="section-title">Описание</h2>
        <div 
            ref="descriptionRef"
            class="description"
            :class="{ 'description-collapsed': !isDescriptionExpanded && shouldShowExpandButton }"
            :style="{ maxHeight: descriptionMaxHeight }"
            v-html="safeDescription"
        ></div>
        <button 
            v-if="shouldShowExpandButton"
            class="expand-description-btn"
            @click="toggleDescription"
        >
          {{ isDescriptionExpanded ? 'Свернуть' : 'Развернуть' }}
        </button>
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
    
    <!-- Модальное окно уведомлений -->
    <NotificationModal
        v-if="modalVisible"
        :is-visible="modalVisible"
        :type="modalType"
        :title="modalTitle"
        :message="modalMessage"
        :confirm-text="modalConfirmText"
        :cancel-text="modalCancelText"
        :show-cancel="modalShowCancel"
        :auto-close="modalAutoClose"
        @close="closeModal"
        @confirm="handleModalConfirm"
        @cancel="closeModal"
    />
  </div>
</template>

<script setup lang="ts">
import NotificationModal from '~/components/UIComponents/NotificationModal.vue'
import GameCard from '~/components/Home/GameCard.vue'
import { useGameShopStore } from '~/stores/GameShop'
import SkeletonGameDetail from '~/components/UIComponents/SkeletonGameDetail.vue'
import SkeletonPriceCard from '~/components/UIComponents/SkeletonPriceCard.vue'

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
    const gameData = (data.value as { game: GameDetails }).game
    
    // Сохраняем данные игры в sessionStorage
    if (process.client && gameData) {
      try {
        const gameStorageKey = `game_${gameData.slug}`
        sessionStorage.setItem(gameStorageKey, JSON.stringify({
          id: gameData.id,
          slug: gameData.slug,
          name: gameData.name,
          released: gameData.released,
          rating: gameData.rating,
          backgroundImage: gameData.backgroundImage,
          platforms: gameData.platforms,
          genres: gameData.genres,
          developer: gameData.developer,
          publisher: gameData.publisher,
          price: gameData.price,
          storeName: gameData.storeName,
          storeURL: gameData.storeURL,
          stores: gameData.stores,
          website: gameData.website,
          description: gameData.description,
          screenshots: gameData.screenshots,
          trailer: gameData.trailer,
          trailerPreview: gameData.trailerPreview,
          gameSeries: gameData.gameSeries,
          isDLC: gameData.isDLC,
          parentGame: gameData.parentGame,
          ageRating: gameData.ageRating,
          tags: gameData.tags,
          priceSource: gameData.priceSource,
          originalPrice: gameData.originalPrice,
          discount: gameData.discount,
          savedAt: new Date().toISOString()
        }))
      } catch (error) {
        console.error('Ошибка при сохранении данных игры в sessionStorage:', error)
      }
    }
    
    return gameData
  }
  return null
})

// минимальная защита: убираем null/undefined, оставляем строку
const safeDescription = computed(() => (game.value?.description || '').trim())

// Видео и изображения
const showVideo = ref(false)
const selectedImageIndex = ref(0)
const imageModalOpen = ref(false)

// Развертывание/сворачивание описания
const descriptionRef = ref<HTMLElement | null>(null)
const posterRef = ref<HTMLElement | null>(null)
const isDescriptionExpanded = ref(false)
const shouldShowExpandButton = ref(false)
const posterHeight = ref<number>(0)

// Вычисляем максимальную высоту описания на основе высоты poster
const descriptionMaxHeight = computed(() => {
  if (!shouldShowExpandButton.value || isDescriptionExpanded.value) {
    return 'none'
  }
  return posterHeight.value > 0 ? `${posterHeight.value}px` : 'none'
})

// Проверяем, нужно ли показывать кнопку развернуть
const checkDescriptionHeight = () => {
  if (!process.client) return
  
  nextTick(() => {
    if (!descriptionRef.value || !posterRef.value) return
    
    const descHeight = descriptionRef.value.scrollHeight
    const postHeight = posterRef.value.offsetHeight
    
    posterHeight.value = postHeight
    
    // Если высота описания больше высоты poster, показываем кнопку
    shouldShowExpandButton.value = descHeight > postHeight
  })
}

// Переключение состояния развернуто/свернуто
const toggleDescription = () => {
  isDescriptionExpanded.value = !isDescriptionExpanded.value
}

// Наблюдаем за изменением описания и изображения
watch(() => safeDescription.value, () => {
  checkDescriptionHeight()
}, { immediate: true })

watch(() => game.value?.backgroundImage, () => {
  checkDescriptionHeight()
})

// Проверяем высоту после загрузки изображения
onMounted(() => {
  if (process.client) {
    // Ждем загрузки изображений
    const img = new Image()
    if (game.value?.backgroundImage) {
      img.src = game.value.backgroundImage
      img.onload = () => {
        setTimeout(checkDescriptionHeight, 100)
      }
    } else {
      setTimeout(checkDescriptionHeight, 100)
    }
    
    // Также проверяем при изменении размера окна
    window.addEventListener('resize', checkDescriptionHeight)
  }
})

onUnmounted(() => {
  if (process.client) {
    window.removeEventListener('resize', checkDescriptionHeight)
  }
})

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

// Проверяем, можно ли добавить игру в корзину
const canAddToCart = computed(() => {
  // Проверяем выбранный магазин
  if (selectedStore.value && typeof selectedStore.value.price === 'number' && selectedStore.value.price > 0) {
    return true
  }
  // Проверяем массив stores
  if (game.value?.stores && game.value.stores.length > 0) {
    const firstStore = game.value.stores[0]
    if (typeof firstStore.price === 'number' && firstStore.price > 0) {
      return true
    }
  }
  // Проверяем прямую цену
  if (typeof game.value?.price === 'number' && game.value.price !== null && game.value.price !== undefined && game.value.price > 0) {
    return true
  }
  return false
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
  // Определяем эффективную цену и магазин
  let effectivePrice: number | null = null
  let storeToAdd: StoreOption | null = null

  // Приоритет 1: выбранный магазин из списка магазинов
  if (selectedStore.value) {
    effectivePrice = selectedStore.value.price
    storeToAdd = selectedStore.value
  }
  // Приоритет 2: первый магазин из массива stores
  else if (g.stores && g.stores.length > 0) {
    const firstStore = g.stores[0]
    if (typeof firstStore.price === 'number' && firstStore.price > 0) {
      effectivePrice = firstStore.price
      storeToAdd = firstStore
    }
  }
  // Приоритет 3: прямая цена из game
  else if (typeof g.price === 'number' && g.price !== null && g.price !== undefined && g.price > 0) {
    effectivePrice = g.price
    storeToAdd = {
      storeID: '',
      storeName: g.storeName || '',
      price: g.price,
      originalPrice: g.originalPrice,
      discount: g.discount,
      storeURL: g.storeURL
    }
  }

  // Не добавляем в корзину если цена неизвестна или равна 0
  if (!effectivePrice || effectivePrice <= 0 || !storeToAdd) {
    return
  }

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

// Сравнение цен из CheapShark для текущей игры
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

const priceComparisons = ref<PriceComparison[]>([])
const priceComparisonsLoading = ref(false)

// Проверяем, есть ли у игры дата релиза
const hasReleaseDate = computed(() => {
  return game.value?.released && game.value.released.trim() !== ''
})

// Загружаем сравнение цен для текущей игры (только если есть дата релиза)
const loadPriceComparisons = async () => {
  if (!game.value || !game.value.slug) {
    return
  }

  // Не загружаем цены, если нет даты релиза
  if (!hasReleaseDate.value) {
    priceComparisons.value = []
    priceComparisonsLoading.value = false
    return
  }

  priceComparisonsLoading.value = true
  try {
    const response = await $fetch<{ prices: PriceComparison[] }>(`/api/games/${game.value.slug}/prices`)
    console.log('[Client] Получен ответ от API цен:', response)
    if (response && response.prices) {
      console.log(`[Client] Загружено ${response.prices.length} цен для "${game.value.name}"`)
      priceComparisons.value = response.prices
      if (response.prices.length === 0) {
        console.warn(`[Client] Нет цен для "${game.value.name}" - возможно, игра не найдена в CheapShark`)
      }
    } else {
      console.warn('[Client] Ответ от API не содержит prices:', response)
      priceComparisons.value = []
    }
  } catch (error) {
    console.error('[Client] Ошибка при загрузке сравнения цен:', error)
    priceComparisons.value = []
  } finally {
    priceComparisonsLoading.value = false
  }
}

// Загружаем сравнение цен при загрузке игры (только если есть дата релиза)
watch(() => game.value?.slug, (slug) => {
  if (slug && hasReleaseDate.value) {
    loadPriceComparisons()
  } else {
    priceComparisons.value = []
    priceComparisonsLoading.value = false
  }
}, { immediate: true })

// Также следим за изменением даты релиза
watch(() => game.value?.released, (released) => {
  if (game.value?.slug && released && released.trim() !== '') {
    loadPriceComparisons()
  } else {
    priceComparisons.value = []
    priceComparisonsLoading.value = false
  }
})

// Состояние модального окна
const modalVisible = ref(false)
const modalType = ref<'success' | 'error' | 'info' | 'warning'>('success')
const modalTitle = ref('')
const modalMessage = ref('')
const modalConfirmText = ref('OK')
const modalCancelText = ref('Отмена')
const modalShowCancel = ref(false)
const modalAutoClose = ref(false)
const pendingAction = ref<(() => void) | null>(null)

// Показать модальное окно
const showModal = (
  type: 'success' | 'error' | 'info' | 'warning',
  title: string,
  message?: string,
  options?: {
    confirmText?: string
    cancelText?: string
    showCancel?: boolean
    autoClose?: boolean
    onConfirm?: () => void
  }
) => {
  modalType.value = type
  modalTitle.value = title
  modalMessage.value = message || ''
  modalConfirmText.value = options?.confirmText || 'OK'
  modalCancelText.value = options?.cancelText || 'Отмена'
  modalShowCancel.value = options?.showCancel || false
  modalAutoClose.value = options?.autoClose || false
  pendingAction.value = options?.onConfirm || null
  modalVisible.value = true
}

// Закрыть модальное окно
const closeModal = () => {
  modalVisible.value = false
  pendingAction.value = null
}

// Подтверждение в модальном окне
const handleModalConfirm = () => {
  if (pendingAction.value) {
    pendingAction.value()
  }
}

// Обработчик для кнопки "Купить" - открывает магазин и добавляет в корзину
const handleBuyAndAddToCart = () => {
  if (gameShopStore.isInCart(game.value?.id || 0)) {
    // Если уже в корзине, удаляем
    const gameName = game.value?.name || 'Игра'
    gameShopStore.removeFromCart(game.value!.id)
    showModal('info', 'Товар удален', `"${gameName}" удален из корзины`, { autoClose: true })
  } else {
    // Сначала добавляем в корзину
    if (game.value) {
      addToCart(game.value)
      showModal('success', 'Товар добавлен', `"${game.value.name}" добавлен в корзину`, { autoClose: true })
    }
    // Затем открываем ссылку на магазин
    if (selectedStore.value?.storeURL) {
      window.open(selectedStore.value.storeURL, '_blank', 'noopener,noreferrer')
    }
  }
}

// Обработчик для кнопки "Купить" - добавляет/удаляет из корзины
const handleBuyToggle = () => {
  if (gameShopStore.isInCart(game.value?.id || 0)) {
    // Удаляем из корзины
    const gameName = game.value?.name || 'Игра'
    gameShopStore.removeFromCart(game.value!.id)
    showModal('info', 'Товар удален', `"${gameName}" удален из корзины`, { autoClose: true })
  } else {
    // Добавляем в корзину
    if (game.value) {
      addToCart(game.value)
      showModal('success', 'Товар добавлен', `"${game.value.name}" добавлен в корзину`, { autoClose: true })
    }
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
  padding: 0;
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
  transition: all 0.2s;
  position: relative;
  min-width: 200px;
}

.buy-button:hover:not(:disabled) {
  background: #ff7070;
}

.buy-button.in-cart {
  background: #4caf50;
}

.buy-button.in-cart:hover:not(:disabled) {
  background: #f44336;
}

.buy-button-content {
  position: relative;
  display: inline-block;
  width: 100%;
}

.buy-check-icon {
  display: block;
  transition: opacity 0.2s, transform 0.2s;
}

.buy-remove-text {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  opacity: 0;
  transform: translateY(-10px);
  transition: opacity 0.2s, transform 0.2s;
}

.buy-button.in-cart:hover:not(:disabled) .buy-check-icon {
  opacity: 0;
  transform: translateY(10px);
}

.buy-button.in-cart:hover:not(:disabled) .buy-remove-text {
  opacity: 1;
  transform: translateY(0);
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

.cart-button:hover:not(:disabled) {
  background: #e0e0e0;
}

.cart-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
  transition: max-height 0.3s ease, overflow 0.3s ease;
  overflow: hidden;
}

.description-collapsed {
  position: relative;
}

.description-collapsed::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: linear-gradient(to bottom, transparent, white);
  pointer-events: none;
}

.expand-description-btn {
  margin-top: 16px;
  padding: 10px 20px;
  background: #1976d2;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  align-self: flex-start;
}

.expand-description-btn:hover {
  background: #1565c0;
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

.price-comparison-section {
  margin-top: 40px;
}

.price-comparison-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
  margin-top: 24px;
}

.price-comparison-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 24px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;
}

.price-comparison-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #e5e7eb 0%, #e5e7eb 100%);
  transition: all 0.3s ease;
}

.price-comparison-card:hover {
  border-color: #1976d2;
  box-shadow: 0 8px 24px rgba(25, 118, 210, 0.12);
  transform: translateY(-4px);
}

.price-comparison-card:hover::before {
  background: linear-gradient(90deg, #1976d2 0%, #1565c0 100%);
}

.price-comparison-card.best-price {
  border-color: #4caf50;
  background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 50%);
  box-shadow: 0 4px 16px rgba(76, 175, 80, 0.1);
}

.price-comparison-card.best-price::before {
  background: linear-gradient(90deg, #4caf50 0%, #45a049 100%);
}

.price-comparison-card.best-price:hover {
  box-shadow: 0 8px 24px rgba(76, 175, 80, 0.2);
  border-color: #45a049;
}

.price-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  min-height: 48px;
}

.price-card-header .store-name {
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
  line-height: 1.4;
  flex: 1;
  padding-right: 12px;
}

.best-price-badge {
  background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
  color: white;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
  flex-shrink: 0;
}

.price-card-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.price-main {
  display: flex;
  align-items: baseline;
  gap: 12px;
  flex-wrap: wrap;
}

.price-comparison-card .price-value {
  font-size: 32px;
  font-weight: 800;
  color: #1976d2;
  line-height: 1;
  letter-spacing: -0.5px;
}

.price-comparison-card.best-price .price-value {
  color: #4caf50;
}

.price-original {
  font-size: 18px;
  color: #9ca3af;
  text-decoration: line-through;
  font-weight: 500;
}

.price-discount {
  display: inline-flex;
  align-items: center;
  color: #4caf50;
  font-weight: 700;
  font-size: 15px;
  background: rgba(76, 175, 80, 0.1);
  padding: 4px 10px;
  border-radius: 8px;
  width: fit-content;
}

.price-rating {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #6b7280;
  font-size: 14px;
  font-weight: 500;
}

.price-rating::before {
  content: '⭐';
  font-size: 16px;
}

.price-unavailable {
  display: flex;
  align-items: center;
  min-height: 40px;
}

.price-unavailable-text {
  font-size: 16px;
  font-weight: 600;
  color: #9ca3af;
  font-style: italic;
}

.price-buy-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 14px 24px;
  background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
  color: white;
  text-align: center;
  text-decoration: none;
  border-radius: 12px;
  font-weight: 700;
  font-size: 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  margin-top: auto;
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.2);
  border: none;
  cursor: pointer;
}

.price-buy-button::after {
  content: '→';
  font-size: 18px;
  transition: transform 0.3s ease;
}

.price-buy-button:hover {
  background: linear-gradient(135deg, #1565c0 0%, #0d47a1 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(25, 118, 210, 0.35);
}

.price-buy-button:hover::after {
  transform: translateX(4px);
}

.price-comparison-card.best-price .price-buy-button {
  background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
}

.price-comparison-card.best-price .price-buy-button:hover {
  background: linear-gradient(135deg, #45a049 0%, #388e3c 100%);
  box-shadow: 0 6px 16px rgba(76, 175, 80, 0.4);
}

.price-buy-button-disabled {
  background: #e5e7eb !important;
  color: #9ca3af !important;
  cursor: not-allowed !important;
  pointer-events: none;
}

.price-buy-button-disabled:hover {
  background: #e5e7eb !important;
  transform: none !important;
  box-shadow: none !important;
}

.price-buy-button-disabled::after {
  display: none;
}

@media (max-width: 768px) {
  .price-comparison-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .price-comparison-card {
    padding: 20px;
  }
  
  .price-card-header .store-name {
    font-size: 16px;
  }
  
  .price-comparison-card .price-value {
    font-size: 28px;
  }
}

@media (max-width: 480px) {
  .price-comparison-grid {
    gap: 16px;
  }
  
  .price-comparison-card {
    padding: 16px;
  }
  
  .price-card-header {
    margin-bottom: 16px;
    min-height: 40px;
  }
  
  .price-card-header .store-name {
    font-size: 15px;
  }

  .best-price-badge {
    font-size: 10px;
    padding: 4px 10px;
  }
  
  .price-comparison-card .price-value {
    font-size: 24px;
  }

  .price-original {
    font-size: 16px;
  }

  .price-buy-button {
    padding: 12px 20px;
    font-size: 14px;
  }
}

@media (max-width: 375px) {
  .price-comparison-grid {
    gap: 12px;
  }
  
  .price-comparison-card {
    padding: 14px;
  }
  
  .price-card-header .store-name {
    font-size: 14px;
  }

  .best-price-badge {
    font-size: 9px;
    padding: 3px 8px;
  }
  
  .price-comparison-card .price-value {
    font-size: 22px;
  }

  .price-original {
    font-size: 14px;
  }

  .price-discount {
    font-size: 13px;
    padding: 3px 8px;
  }

  .price-rating {
    font-size: 12px;
  }

  .price-buy-button {
    padding: 10px 16px;
    font-size: 13px;
  }

  .price-unavailable-text {
    font-size: 14px;
  }
}
</style>
