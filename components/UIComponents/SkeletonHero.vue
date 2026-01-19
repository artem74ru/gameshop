<template>
  <div class="skeleton-hero">
    <div class="skeleton-hero-container">
      <div class="skeleton-hero-content">
        <div class="skeleton-hero-image"></div>
        <div class="skeleton-hero-info">
          <div class="skeleton-hero-badge"></div>
          <div class="skeleton-hero-title"></div>
          <div class="skeleton-hero-text"></div>
          <div class="skeleton-hero-text short"></div>
          <div class="skeleton-hero-tags">
            <div v-for="i in 4" :key="i" class="skeleton-hero-tag"></div>
          </div>
          <div class="skeleton-hero-price"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Компонент скелетона для HeroBig
</script>

<style scoped lang="scss">
.skeleton-hero {
  position: relative;
  overflow: hidden;
  border-radius: 12px;
  background: white;
  padding: 24px;
}

.skeleton-hero-container {
  position: relative;
  width: 100%;
  height: 400px;
}

.skeleton-hero-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  height: 100%;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.skeleton-hero-image {
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite;
  border-radius: 8px;
}

.skeleton-hero-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px 0;
}

.skeleton-hero-badge {
  height: 24px;
  width: 80px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite;
  border-radius: 4px;
}

.skeleton-hero-title {
  height: 32px;
  width: 70%;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite;
  border-radius: 6px;
}

.skeleton-hero-text {
  height: 16px;
  width: 100%;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite;
  border-radius: 4px;
  
  &.short {
    width: 60%;
  }
}

.skeleton-hero-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.skeleton-hero-tag {
  height: 28px;
  width: 80px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite;
  border-radius: 4px;
}

.skeleton-hero-price {
  height: 28px;
  width: 100px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite;
  border-radius: 4px;
  margin-top: auto;
}

@keyframes skeleton-shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}
</style>
