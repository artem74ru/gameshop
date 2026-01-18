<template>
  <div class="carousel">
    <h3>{{ title }}</h3>

    <div v-if="games.length > 0" class="row">
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
}>()
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
</style>
