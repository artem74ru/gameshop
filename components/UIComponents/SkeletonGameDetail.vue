<template>
  <div class="skeleton-game-detail">
    <!-- Breadcrumbs skeleton -->
    <div class="skeleton-breadcrumbs">
      <div class="skeleton-breadcrumb"></div>
      <div class="skeleton-breadcrumb"></div>
      <div class="skeleton-breadcrumb short"></div>
    </div>

    <!-- Top section skeleton -->
    <div class="skeleton-top">
      <div class="skeleton-poster">
        <div class="skeleton-image-large"></div>
        <div class="skeleton-thumbnails">
          <div v-for="i in 4" :key="i" class="skeleton-thumbnail"></div>
        </div>
      </div>
      <div class="skeleton-info">
        <div class="skeleton-title-large"></div>
        <div class="skeleton-meta">
          <div class="skeleton-badge"></div>
          <div class="skeleton-badge"></div>
          <div class="skeleton-badge"></div>
        </div>
        <div class="skeleton-details">
          <div class="skeleton-detail-item"></div>
          <div class="skeleton-detail-item"></div>
          <div class="skeleton-detail-item short"></div>
        </div>
        <div class="skeleton-price-section">
          <div class="skeleton-price-large"></div>
          <div class="skeleton-button"></div>
        </div>
      </div>
    </div>

    <!-- Price comparison skeleton -->
    <div class="skeleton-price-comparison">
      <div class="skeleton-section-title"></div>
      <div class="skeleton-price-grid">
        <div v-for="i in 3" :key="i" class="skeleton-price-card"></div>
      </div>
    </div>

    <!-- Description skeleton -->
    <div class="skeleton-description">
      <div class="skeleton-section-title"></div>
      <div class="skeleton-text-line" v-for="i in 8" :key="i" :class="{ short: i > 6 }"></div>
    </div>

    <!-- Related games skeleton -->
    <div class="skeleton-related">
      <div class="skeleton-section-title"></div>
      <div class="skeleton-games-grid">
        <div v-for="i in 9" :key="i" class="skeleton-game-card"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Компонент скелетона для страницы игры
</script>

<style scoped lang="scss">
.skeleton-game-detail {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.skeleton-breadcrumbs {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 24px;
}

.skeleton-breadcrumb {
  height: 16px;
  width: 100px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite;
  border-radius: 4px;
  
  &.short {
    width: 60px;
  }
}

.skeleton-top {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 32px;
  margin-bottom: 40px;
  
  @media (max-width: 968px) {
    grid-template-columns: 1fr;
  }
}

.skeleton-poster {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.skeleton-image-large {
  width: 100%;
  height: 500px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite;
  border-radius: 12px;
}

.skeleton-thumbnails {
  display: flex;
  gap: 12px;
}

.skeleton-thumbnail {
  width: 120px;
  height: 80px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite;
  border-radius: 8px;
}

.skeleton-info {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.skeleton-title-large {
  height: 36px;
  width: 70%;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite;
  border-radius: 6px;
}

.skeleton-meta {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.skeleton-badge {
  height: 28px;
  width: 80px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite;
  border-radius: 14px;
}

.skeleton-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton-detail-item {
  height: 18px;
  width: 100%;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite;
  border-radius: 4px;
  
  &.short {
    width: 60%;
  }
}

.skeleton-price-section {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: auto;
}

.skeleton-price-large {
  height: 40px;
  width: 120px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite;
  border-radius: 8px;
}

.skeleton-button {
  height: 48px;
  width: 150px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite;
  border-radius: 8px;
}

.skeleton-price-comparison,
.skeleton-description,
.skeleton-related {
  margin-bottom: 40px;
}

.skeleton-section-title {
  height: 28px;
  width: 200px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite;
  border-radius: 6px;
  margin-bottom: 20px;
}

.skeleton-price-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
}

.skeleton-price-card {
  height: 200px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite;
  border-radius: 16px;
}

.skeleton-text-line {
  height: 16px;
  width: 100%;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite;
  border-radius: 4px;
  margin-bottom: 8px;
  
  &.short {
    width: 70%;
  }
}

.skeleton-games-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}

.skeleton-game-card {
  height: 280px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite;
  border-radius: 12px;
}

@keyframes skeleton-shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

@media (max-width: 768px) {
  .skeleton-price-grid {
    grid-template-columns: 1fr;
  }
  
  .skeleton-games-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
}
</style>
