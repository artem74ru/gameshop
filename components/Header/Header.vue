<template>
  <div class="header-wrapper">
    <div class="header-nav">
      <div class="header-nav-content">
        <div class="nav-left">
          <NuxtLink to="/" class="nav-link brand">Гейм шоп</NuxtLink>
          <NuxtLink to="/catalog" class="nav-link">Каталог</NuxtLink>
        </div>
        <div class="nav-right">
          <NuxtLink to="/cart" class="nav-link cart-link">
            Корзина
            <span v-if="gameShopStore.count > 0" class="cart-badge">
              {{ gameShopStore.count }}
            </span>
          </NuxtLink>
          <button class="header-button" @click="openAuthModal">ВОЙТИ</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useGameShopStore } from '~/stores/GameShop'

const gameShopStore = useGameShopStore()

const openAuthModal = () => {
  // TODO: Открыть модальное окно авторизации
  console.log('Open auth modal')
}
</script>

<style lang="scss" scoped>
.header-wrapper {
  width: 100%;
}

.header-nav {
  width: 100%;
  background-color: #FFFFFF;
  border-bottom: 1px solid #e0e0e0;
}

.header-nav-content {
  max-width: 1440px;
  margin: 0 auto;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 32px;
}

.nav-link {
  color: #000000;
  text-decoration: none;
  font-size: 16px;
  font-weight: 400;
  transition: color 0.2s;
  white-space: nowrap;
}

.nav-link:hover {
  color: #1976d2;
}

.nav-link.brand {
  font-weight: 500;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 24px;
}

.cart-link {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #000000;
}

.cart-badge {
  background: #1976d2;
  color: white;
  border-radius: 12px;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 600;
  min-width: 20px;
  text-align: center;
}

.header-button {
  height: 35px;
  min-width: 80px;
  padding: 0 20px;
  background-color: #FF8989;
  color: #FFFFFF;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  text-transform: uppercase;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
  white-space: nowrap;
}

.header-button:hover {
  background-color: #ff7070;
}
</style>