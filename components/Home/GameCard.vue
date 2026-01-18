<template>
  <div class="card-wrapper">
    <NuxtLink :to="`/game/${game.slug}`" class="card-link">
      <div class="card">
        <div class="img">
          <img
            class="card-picture"
            :src="getGameImage(game)"
            :alt="game.name"
          >
          <div v-if="game.isDLC || checkIfDLC(game)" class="dlc-badge">DLC</div>
        </div>

        <div class="info">
          <div class="name">{{ game.name }}</div>

          <!-- Рейтинг и дата релиза -->
          <div class="meta-info">
            <div v-if="game.rating !== null && game.rating !== undefined" class="rating">
              <span class="rating-icon">★</span>
              <span class="rating-value">{{ formatRating(game.rating) }}</span>
            </div>
            <div v-if="game.released" class="released">
              {{ formatDate(game.released) }}
            </div>
          </div>

          <div v-if="game.genres && game.genres.length > 0" class="tags">
            <span
                v-for="genre in game.genres.slice(0, 3)"
                :key="genre.id"
                class="tag"
            >
              {{ genre.name }}
            </span>
          </div>

          <div class="price-container">
            <span class="price">{{ formatPrice(availablePrice) }}</span>
          </div>

      
        </div>
      </div>
    </NuxtLink>
    
    <!-- Кнопка корзины вынесена из NuxtLink чтобы не было перехода -->
    <button 
        class="cart-icon-btn"
        :class="{ 'in-cart': gameShopStore.isInCart(game.id) }"
        @click="handleCartToggle"
        :disabled="!canAddToCart"
        :title="gameShopStore.isInCart(game.id) ? 'Удалить' : 'Добавить в корзину'"
    >
      <span v-if="gameShopStore.isInCart(game.id)" class="cart-icon-content">
        <span class="check-icon">✓</span>
        <span class="remove-icon">✕</span>
      </span>
      <span v-else>🛒</span>
    </button>
  </div>
  
  <!-- Модальное окно уведомлений -->
  <NotificationModal
      :is-visible="modalVisible"
      :type="modalType"
      :title="modalTitle"
      :message="modalMessage"
      :auto-close="true"
      :auto-close-delay="2000"
      @close="closeModal"
      @confirm="closeModal"
  />
</template>

<script setup lang="ts">
import { getGameImage } from '~/utils/useGameImage'
import { useGameShopStore } from '~/stores/GameShop'
import NotificationModal from '~/components/UIComponents/NotificationModal.vue'

interface StoreOption {
  storeID: string
  storeName: string
  price: number
  originalPrice?: number
  discount?: number
  dealID?: string
  storeURL?: string
}

interface Game {
  id: number
  slug: string
  name: string
  price?: number | null
  platforms: string[]
  genres?: Array<{ id: number; name: string; slug: string }>
  backgroundImage?: string
  isDLC?: boolean
  storeName?: string
  storeURL?: string
  stores?: StoreOption[]
  priceSource?: 'cheapshark' | 'generated' | 'console_store'
  rating?: number | null
  released?: string | null
}

const props = defineProps<{
  game: Game
}>()

const gameShopStore = useGameShopStore()

// Состояние модального окна
const modalVisible = ref(false)
const modalType = ref<'success' | 'error' | 'info' | 'warning'>('success')
const modalTitle = ref('')
const modalMessage = ref('')

// Показать уведомление
const showNotification = (type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string) => {
  modalType.value = type
  modalTitle.value = title
  modalMessage.value = message || ''
  modalVisible.value = true
}

// Закрыть модальное окно
const closeModal = () => {
  modalVisible.value = false
}


const formatPrice = (price?: number | null) => {
  if (typeof price !== 'number' || price === null || price === undefined || price <= 0) {
    return '—'
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price)
}

const formatRating = (rating: number | null | undefined) => {
  if (typeof rating !== 'number' || rating === null || rating === undefined) {
    return '—'
  }
  return rating.toFixed(1)
}

const formatDate = (date: string | null | undefined) => {
  if (!date) return '—'
  try {
    const d = new Date(date)
    if (Number.isNaN(d.getTime())) return date
    return d.toLocaleDateString('ru-RU', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return date
  }
}

// Дополнительная проверка DLC на клиенте (на случай если API не вернул)
const checkIfDLC = (game: Game) => {
  if (game.isDLC) return true
  const name = game.name.toLowerCase()
  const slug = game.slug.toLowerCase()
  return name.includes('dlc') || 
         name.includes('add-on') || 
         name.includes('addon') ||
         name.includes('expansion') ||
         slug.includes('dlc') ||
         slug.includes('add-on')
}

// Получаем доступную цену (из game.price или из stores)
const availablePrice = computed(() => {
  // Сначала проверяем прямую цену
  if (typeof props.game.price === 'number' && props.game.price !== null && props.game.price !== undefined && props.game.price > 0) {
    return props.game.price
  }
  // Если прямой цены нет, проверяем массив stores
  if (props.game.stores && props.game.stores.length > 0) {
    const firstStore = props.game.stores[0]
    if (typeof firstStore.price === 'number' && firstStore.price > 0) {
      return firstStore.price
    }
  }
  return null
})

// Проверяем, можно ли добавить игру в корзину (есть цена)
const canAddToCart = computed(() => {
  return availablePrice.value !== null
})

// Получаем информацию о магазине для добавления в корзину
const storeInfo = computed(() => {
  // Если есть массив stores, используем первый магазин
  if (props.game.stores && props.game.stores.length > 0) {
    const firstStore = props.game.stores[0]
    return {
      storeName: firstStore.storeName,
      storeURL: firstStore.storeURL
    }
  }
  // Иначе используем прямые поля
  return {
    storeName: props.game.storeName,
    storeURL: props.game.storeURL
  }
})

// Обработчик добавления/удаления из корзины
const handleCartToggle = () => {
  if (gameShopStore.isInCart(props.game.id)) {
    // Удаляем из корзины
    gameShopStore.removeFromCart(props.game.id)
    showNotification('info', 'Товар удален', `"${props.game.name}" удален из корзины`)
  } else {
    // Добавляем в корзину
    const price = availablePrice.value
    if (!price || price <= 0) {
      return
    }

    gameShopStore.addToCart({
      id: props.game.id,
      slug: props.game.slug,
      name: props.game.name,
      price: price,
      backgroundImage: props.game.backgroundImage || null,
      platforms: props.game.platforms,
      storeName: storeInfo.value.storeName,
      storeURL: storeInfo.value.storeURL
    })
    showNotification('success', 'Товар добавлен', `"${props.game.name}" добавлен в корзину`)
  }
}
</script>

<style scoped>
.card-wrapper {
  position: relative;
  width: 100%;
}

.card-link {
  text-decoration: none;
  color: inherit;
  display: block;
}

.card {
  width: 100%;
  background: #f5f5f5;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  height: 100%;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

.img {
  background: #d3d3d3;
  height: 200px;
  width: 100%;
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
}

.card-picture {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.info {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.name {
  font-weight: 500;
  font-size: 14px;
  color: #000;
  margin-bottom: 4px;
}

.meta-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
  font-size: 12px;
}

.rating {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #666;
}

.rating-icon {
  color: #ffc107;
  font-size: 14px;
  line-height: 1;
}

.rating-value {
  font-weight: 600;
  color: #333;
}

.released {
  color: #666;
  font-size: 12px;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag {
  font-size: 11px;
  color: #666;
  background: #e0e0e0;
  padding: 4px 8px;
  border-radius: 4px;
  white-space: nowrap;
}

.price-container {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.price {
  font-weight: 600;
  font-size: 14px;
  color: #000;
}

.stores-count {
  font-size: 11px;
  color: #1976d2;
  font-weight: 500;
}

.action-icons {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  align-items: center;
}

.cart-icon-btn {
  position: absolute;
  bottom: 12px;
  right: 12px;
  width: 36px;
  height: 36px;
  background: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  transition: all 0.2s;
  padding: 0;
  flex-shrink: 0;
  z-index: 10;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.cart-icon-btn:hover:not(:disabled) {
  background: #e0e0e0;
  border-color: #1976d2;
  transform: scale(1.1);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.cart-icon-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cart-icon-btn.in-cart {
  background: #4caf50;
  border-color: #4caf50;
  color: white;
}

.cart-icon-btn.in-cart:hover {
  background: #f44336;
  border-color: #f44336;
}

.cart-icon-content {
  position: relative;
  display: inline-block;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.check-icon {
  display: block;
  transition: opacity 0.2s, transform 0.2s;
}

.remove-icon {
  position: absolute;
  display: block;
  opacity: 0;
  transform: scale(0.5);
  transition: opacity 0.2s, transform 0.2s;
  font-weight: bold;
}

.cart-icon-btn.in-cart:hover .check-icon {
  opacity: 0;
  transform: scale(0.5);
}

.cart-icon-btn.in-cart:hover .remove-icon {
  opacity: 1;
  transform: scale(1);
}

.icon-placeholder {
  width: 24px;
  height: 24px;
  background: #e0e0e0;
  border-radius: 4px;
}

.price-source {
  font-size: 11px;
  color: #666;
  font-weight: 500;
}

.price-source-link {
  font-size: 11px;
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
  font-size: 12px;
  color: #1976d2;
  font-weight: 600;
  text-decoration: none;
  transition: color 0.2s;
  padding: 4px 8px;
  border: 1px solid #1976d2;
  border-radius: 4px;
  display: inline-block;
}

.console-store-link:hover {
  color: #1565c0;
  border-color: #1565c0;
  background-color: rgba(25, 118, 210, 0.05);
}

.dlc-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: #7b2cbf !important;
  color: white !important;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  z-index: 10;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  pointer-events: none;
  display: block !important;
  line-height: 1.2;
}

.announce-badge {
  background: #7b2cbf;
  color: white;
  padding: 6px 10px;
  border-radius: 6px;
  font-weight: 700;
  text-transform: uppercase;
  font-size: 12px;
}
</style>
