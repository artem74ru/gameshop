<template>
  <div class="base-container">
    <slot />
  </div>
</template>

<style scoped>
.base-container {
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 20px; /* можно 16px/24px по дизайну */
  width: 100%;
  box-sizing: border-box;
  margin-top: 32px;
}
</style>
