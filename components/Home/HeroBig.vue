<template>
  <SkeletonHero v-if="isLoading" />
  <div v-else class="hero-carousel" @mouseenter="pauseAutoPlay" @mouseleave="resumeAutoPlay">
    <div class="hero-container">
      <NuxtLink
          v-for="(game, index) in games"
          :key="game.id"
          :to="`/game/${game.slug}`"
          class="hero-link"
          :class="{ active: currentIndex === index }"
      >
        <div class="hero">
          <div class="hero-image">
            <img
                class="hero-image-picture"
                :src="getGameImage(game)"
                :alt="game.name"
            >
          </div>

          <div class="hero-info">
            <div class="hero-label">Новинка</div>

            <h2>{{ game.name }}</h2>

            <p class="desc">
              {{ getShortDescription(game) }}
            </p>

            <div v-if="game.genres && game.genres.length > 0" class="tags">
              <span
                  v-for="genre in game.genres.slice(0, 5)"
                  :key="genre.id"
                  class="tag"
              >
                {{ genre.name }}
              </span>
            </div>

            <div class="price-container">
              <span class="price">{{ formatPrice(game.price) }}</span>
            </div>
          </div>
        </div>
      </NuxtLink>
    </div>

    <!-- Кнопки навигации -->
    <button
        class="carousel-btn carousel-btn-prev"
        @click="prevSlide"
        aria-label="Предыдущий слайд"
    >
      ‹
    </button>
    <button
        class="carousel-btn carousel-btn-next"
        @click="nextSlide"
        aria-label="Следующий слайд"
    >
      ›
    </button>

    <!-- Индикаторы -->
    <div class="carousel-indicators">
      <button
          v-for="(game, index) in games"
          :key="game.id"
          class="indicator"
          :class="{ active: currentIndex === index }"
          @click="goToSlide(index)"
          :aria-label="`Перейти к слайду ${index + 1}`"
      ></button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Game {
  id: number
  slug: string
  name: string
  price?: number | null
  platforms: string[]
  genres?: Array<{ id: number; name: string; slug: string }>
  description?: string
  backgroundImage?: string
  isDLC?: boolean
  storeName?: string
  storeURL?: string
  priceSource?: 'cheapshark' | 'generated' | 'console_store' | null
  priceNote?: string | null
}

import { getGameImage } from '~/utils/useGameImage'

const props = defineProps<{
  games: Game[]
  loading?: boolean
}>()

const isLoading = computed(() => props.loading ?? false)

// Ограничиваем до 5 игр
const games = computed(() => props.games.slice(0, 5))

const currentIndex = ref(0)
let autoPlayInterval: NodeJS.Timeout | null = null
const autoPlayDelay = 5000 // 5 секунд

const getShortDescription = (game: Game) => {
  if (!game.description) return ''
  const desc = game.description.trim()
  if (desc.length <= 150) return desc
  return desc.slice(0, 150) + '...'
}

const formatPrice = (price?: number | null) => {
  if (typeof price !== 'number' || price === null || price === undefined || price <= 0) {
    return '—'
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price)
}

const nextSlide = () => {
  currentIndex.value = (currentIndex.value + 1) % games.value.length
  resetAutoPlay()
}

const prevSlide = () => {
  currentIndex.value = currentIndex.value === 0 ? games.value.length - 1 : currentIndex.value - 1
  resetAutoPlay()
}

const goToSlide = (index: number) => {
  currentIndex.value = index
  resetAutoPlay()
}

const startAutoPlay = () => {
  if (games.value.length <= 1) return
  autoPlayInterval = setInterval(() => {
    nextSlide()
  }, autoPlayDelay)
}

const pauseAutoPlay = () => {
  if (autoPlayInterval) {
    clearInterval(autoPlayInterval)
    autoPlayInterval = null
  }
}

const resumeAutoPlay = () => {
  pauseAutoPlay()
  startAutoPlay()
}

const resetAutoPlay = () => {
  pauseAutoPlay()
  startAutoPlay()
}

onMounted(() => {
  if (games.value.length > 1) {
    startAutoPlay()
  }
})

onUnmounted(() => {
  pauseAutoPlay()
})
</script>

<style scoped>
.hero-carousel {
  position: relative;
  overflow: hidden;
  border-radius: 12px;
}

.hero-container {
  position: relative;
  width: 100%;
  height: 400px;
}

.hero-link {
  text-decoration: none;
  color: inherit;
  display: block;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  transform: translateX(100%);
  transition: opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1), transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: none;
  z-index: 1;
}

.hero-link.active {
  opacity: 1;
  transform: translateX(0);
  pointer-events: auto;
  z-index: 2;
}

.hero {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  background: #FFFFFF;
  padding: 24px;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  height: 100%;
  box-sizing: border-box;
}

.hero:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.hero-image {
  background: #d3d3d3;
  height: 100%;
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-image::after {
  content: '▶';
  position: absolute;
  font-size: 48px;
  color: rgba(255, 255, 255, 0.8);
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.hero-image-picture {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-label {
  background: #9cff9c;
  padding: 6px 12px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 12px;
  display: inline-block;
  margin-bottom: 12px;
  color: #000;
}

.announce-badge {
  background: #7b2cbf;
  padding: 6px 10px;
  border-radius: 6px;
  font-weight: 700;
  color: white;
  display: inline-block;
}

.tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin: 12px 0;
}

.tag {
  background: #e0e0e0;
  color: #000;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.price-container {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.price {
  font-size: 20px;
  font-weight: 600;
  color: #000;
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
  font-size: 14px;
  color: #1976d2;
  font-weight: 600;
  text-decoration: none;
  transition: color 0.2s;
  padding: 6px 12px;
  border: 2px solid #1976d2;
  border-radius: 6px;
  display: inline-block;
}

.console-store-link:hover {
  color: #1565c0;
  border-color: #1565c0;
  background-color: rgba(25, 118, 210, 0.05);
}

.carousel-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.8);
  background: rgba(0, 0, 0, 0.5);
  color: white;
  font-size: 28px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  z-index: 10;
  line-height: 1;
  padding: 0;
}

.carousel-btn:hover {
  background: rgba(0, 0, 0, 0.8);
  border-color: white;
  transform: translateY(-50%) scale(1.1);
}

.carousel-btn-prev {
  left: 20px;
}

.carousel-btn-next {
  right: 20px;
}

.carousel-indicators {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 10px;
  z-index: 10;
}

.indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid white;
  background: rgba(255, 255, 255, 0.3);
  cursor: pointer;
  transition: all 0.3s;
  padding: 0;
}

.indicator:hover {
  background: rgba(255, 255, 255, 0.6);
  transform: scale(1.2);
}

.indicator.active {
  background: white;
  width: 32px;
  border-radius: 6px;
}

@media (max-width: 768px) {
  .hero-container {
    height: 350px;
  }

  .hero {
    grid-template-columns: 1fr;
    padding: 20px;
  }

  .hero-image {
    max-height: 220px;
  }

  .carousel-btn {
    width: 40px;
    height: 40px;
    font-size: 24px;
  }

  .carousel-btn-prev {
    left: 10px;
  }

  .carousel-btn-next {
    right: 10px;
  }

  h2 {
    font-size: 22px;
  }

  .desc {
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .hero-container {
    height: 300px;
  }

  .hero {
    padding: 16px;
  }

  .hero-image {
    max-height: 180px;
  }

  .hero-label {
    font-size: 11px;
    padding: 4px 10px;
  }

  h2 {
    font-size: 18px;
  }

  .desc {
    font-size: 13px;
  }

  .tag {
    font-size: 11px;
    padding: 4px 10px;
  }

  .price {
    font-size: 18px;
  }

  .carousel-btn {
    width: 36px;
    height: 36px;
    font-size: 20px;
  }

  .carousel-btn-prev {
    left: 8px;
  }

  .carousel-btn-next {
    right: 8px;
  }

  .indicator {
    width: 10px;
    height: 10px;
  }

  .indicator.active {
    width: 28px;
  }
}

@media (max-width: 375px) {
  .hero-container {
    height: 280px;
  }

  .hero {
    padding: 12px;
  }

  .hero-image {
    max-height: 160px;
  }

  h2 {
    font-size: 16px;
  }

  .desc {
    font-size: 12px;
  }

  .price {
    font-size: 16px;
  }

  .carousel-btn {
    width: 32px;
    height: 32px;
    font-size: 18px;
  }
}
</style>
