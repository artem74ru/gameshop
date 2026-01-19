<template>
  <div class="carousel">
    <h3>{{ title }}</h3>

    <div v-if="loading" class="row">
      <SkeletonCard v-for="i in 4" :key="`skeleton-${i}`" />
    </div>
    <div v-else-if="games.length > 0" class="row">
      <GameCard
          v-for="g in games"
          :key="g.id"
          :game="g"
      />
    </div>
    <div v-else class="empty-state">
      <p>Игры не найдены</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import GameCard from './GameCard.vue'
import SkeletonCard from '~/components/UIComponents/SkeletonCard.vue'

interface Game {
  id: number
  slug: string
  name: string
  price?: number | null
  platforms: string[]
  backgroundImage?: string
  isDLC?: boolean
}

const props = defineProps<{
  title: string
  games: Game[]
  loading?: boolean
}>()

const loading = computed(() => props.loading ?? false)
</script>

<style scoped>
.carousel {
  padding: 0;
  margin: 24px 0;
}

h3 {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: #000;
}

.row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.empty-state {
  padding: 40px 20px;
  text-align: center;
  color: #666;
}

.empty-state p {
  margin: 0;
  font-size: 16px;
}

@media (max-width: 960px) {
  .row {
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }
}

@media (max-width: 768px) {
  .row {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  h3 {
    font-size: 18px;
  }
}

@media (max-width: 480px) {
  .row {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  h3 {
    font-size: 16px;
    margin-bottom: 12px;
  }
}

@media (max-width: 375px) {
  .row {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  h3 {
    font-size: 15px;
  }
}
</style>
