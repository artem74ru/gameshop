<template>
  <div class="skeleton-price-card">
    <div class="skeleton-price-header">
      <div class="skeleton-store-name"></div>
      <div class="skeleton-badge"></div>
    </div>
    <div class="skeleton-price-body">
      <div class="skeleton-price-main">
        <div class="skeleton-price-value"></div>
        <div class="skeleton-price-original"></div>
      </div>
      <div class="skeleton-discount"></div>
      <div class="skeleton-rating"></div>
    </div>
    <div class="skeleton-buy-button"></div>
  </div>
</template>

<script setup lang="ts">
// Компонент скелетона для карточки цены
</script>

<style scoped lang="scss">
.skeleton-price-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.skeleton-price-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  min-height: 48px;
}

.skeleton-store-name {
  height: 20px;
  width: 120px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite;
  border-radius: 4px;
}

.skeleton-badge {
  height: 24px;
  width: 80px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite;
  border-radius: 12px;
}

.skeleton-price-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton-price-main {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.skeleton-price-value {
  height: 32px;
  width: 100px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite;
  border-radius: 4px;
}

.skeleton-price-original {
  height: 18px;
  width: 60px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite;
  border-radius: 4px;
}

.skeleton-discount {
  height: 20px;
  width: 80px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite;
  border-radius: 8px;
}

.skeleton-rating {
  height: 16px;
  width: 100px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite;
  border-radius: 4px;
}

.skeleton-buy-button {
  height: 48px;
  width: 100%;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite;
  border-radius: 12px;
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
