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
            <span class="price">{{ formatPrice(game.price) }}</span>
            <span v-if="hasStores" class="stores-count">
              <span v-if="game.stores && game.stores.length > 1">
                +{{ game.stores.length - 1 }} магазин{{ game.stores.length - 1 > 1 ? 'ов' : '' }}
              </span>
              <span v-else-if="game.stores && game.stores.length === 1">
                {{ game.stores[0].storeName }}
              </span>
            </span>
          </div>

          <div class="action-icons">
            <div class="icon-placeholder"></div>
            <div class="icon-placeholder"></div>
          </div>
        </div>
      </div>
    </NuxtLink>
    
    <!-- Выпадающий список магазинов -->
    <div 
        v-if="hasStores" 
        class="stores-dropdown"
        :class="{ open: showStoresDropdown }"
        @click.stop
    >
      <button 
          class="stores-dropdown-toggle"
          @click.stop="showStoresDropdown = !showStoresDropdown"
      >
        <span>
          <span v-if="allStores.length > 1">Все магазины ({{ allStores.length }})</span>
          <span v-else>Выбрать магазин</span>
        </span>
        <span class="dropdown-arrow">▼</span>
      </button>
      
      <div v-if="showStoresDropdown" class="stores-dropdown-menu">
        <div
            v-for="(store, index) in allStores"
            :key="store.storeID || index"
            class="store-option"
            :class="{ 'has-link': store.storeURL }"
            @click.stop="selectStore(store)"
        >
          <div class="store-option-name">{{ store.storeName }}</div>
          <div class="store-option-price">
            <span class="store-price-current">{{ formatPrice(store.price) }}</span>
            <span v-if="store.originalPrice && store.originalPrice > store.price" class="store-price-original">
              {{ formatPrice(store.originalPrice) }}
            </span>
            <span v-if="store.discount" class="store-discount">-{{ store.discount }}%</span>
          </div>
          <div v-if="store.storeURL" class="store-option-link">Перейти →</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
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

import { getGameImage } from '~/utils/useGameImage'

const showStoresDropdown = ref(false)

// Проверяем, есть ли магазины с ценами
const hasStores = computed(() => {
  // Если есть массив stores с хотя бы одним элементом
  if (props.game.stores && props.game.stores.length > 0) {
    return true
  }
  // Если есть цена и storeURL (один магазин)
  if (props.game.price && props.game.price > 0 && props.game.storeURL) {
    return true
  }
  return false
})

// Получаем список всех магазинов (из массива или создаем из одного магазина)
const allStores = computed(() => {
  if (props.game.stores && props.game.stores.length > 0) {
    return props.game.stores
  }
  // Если есть цена и storeURL, создаем один магазин
  if (props.game.price && props.game.price > 0 && props.game.storeURL) {
    return [{
      storeID: 'single',
      storeName: props.game.storeName || 'Магазин',
      price: props.game.price,
      originalPrice: props.game.originalPrice,
      discount: props.game.discount,
      storeURL: props.game.storeURL
    }]
  }
  return []
})

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

// Выбор магазина - открываем ссылку на магазин
const selectStore = (store: StoreOption) => {
  if (store.storeURL) {
    window.open(store.storeURL, '_blank', 'noopener,noreferrer')
  }
  showStoresDropdown.value = false
}

// Закрываем выпадающий список при клике вне его
if (process.client) {
  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement
    if (!target.closest('.stores-dropdown')) {
      showStoresDropdown.value = false
    }
  }
  
  onMounted(() => {
    document.addEventListener('click', handleClickOutside)
  })
  
  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
  })
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
  cursor: pointer;
  transition: color 0.2s;
}

.stores-count:hover {
  color: #1565c0;
  text-decoration: underline;
}

.stores-dropdown {
  position: relative;
  width: 100%;
  z-index: 100;
  background: white;
  border-radius: 0 0 8px 8px;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.15);
  overflow: visible;
  margin-top: 4px;
}

.stores-dropdown-toggle {
  width: 100%;
  padding: 8px 12px;
  background: #f9f9f9;
  border: none;
  border-top: 1px solid #e0e0e0;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  font-weight: 500;
  color: #1976d2;
  transition: background 0.2s;
}

.stores-dropdown-toggle:hover {
  background: #f0f0f0;
}

.dropdown-arrow {
  font-size: 10px;
  transition: transform 0.2s;
}

.stores-dropdown.open .dropdown-arrow {
  transform: rotate(180deg);
}

.stores-dropdown-menu {
  max-height: 200px;
  overflow-y: auto;
  background: white;
  border-top: 1px solid #e0e0e0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-radius: 0 0 8px 8px;
}

.store-option {
  padding: 10px 12px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background 0.2s;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  position: relative;
}

.store-option.has-link {
  cursor: pointer;
}

.store-option.has-link:hover {
  background: #f0f7ff;
}

.store-option:hover {
  background: #f9f9f9;
}

.store-option:last-child {
  border-bottom: none;
}

.store-option-name {
  font-size: 13px;
  font-weight: 500;
  color: #000;
  flex: 1;
}

.store-option-price {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.store-price-current {
  font-size: 13px;
  font-weight: 600;
  color: #1976d2;
}

.store-price-original {
  font-size: 11px;
  color: #999;
  text-decoration: line-through;
}

.store-discount {
  font-size: 11px;
  font-weight: 600;
  color: #4caf50;
  background: rgba(76, 175, 80, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
}

.store-option-link {
  font-size: 11px;
  color: #1976d2;
  font-weight: 500;
  margin-left: auto;
  opacity: 0;
  transition: opacity 0.2s;
}

.store-option.has-link:hover .store-option-link {
  opacity: 1;
}

.action-icons {
  display: flex;
  gap: 8px;
  margin-top: 8px;
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
