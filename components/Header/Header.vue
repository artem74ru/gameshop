<template>
  <div class="header-wrapper">
    <div class="header-nav">
      <div class="header-nav-content">
        <div class="nav-left">
          <NuxtLink to="/" class="nav-link brand">
            <img :src="logoImage" alt="GameShop" class="logo" />
          </NuxtLink>
          <NuxtLink to="/catalog" class="nav-link nav-button">Каталог</NuxtLink>
        </div>
        <div class="nav-right">
          <NuxtLink to="/cart" class="nav-link nav-button cart-link">
            <span class="cart-text">Корзина</span>
            <span v-if="gameShopStore.count > 0" class="cart-badge">
              {{ gameShopStore.count }}
            </span>
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useGameShopStore } from '~/stores/GameShop'
import logoImage from '~/assets/images/genres/gameshop-gamepad-solid.svg'

const gameShopStore = useGameShopStore()
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
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
  display: flex;
  align-items: center;
}

.nav-link.brand {
  padding: 0;
  display: flex;
  align-items: center;
}

.logo {
  height: 60px;
  width: auto;
  object-fit: contain;
  transition: transform 0.3s ease;
}

.logo:hover {
  transform: scale(1.05);
}

.nav-button {
  position: relative;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 500;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  letter-spacing: 0.3px;
  background: transparent;
  color: #1f2937;
  overflow: hidden;
}

.nav-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(25, 118, 210, 0.1) 0%, rgba(25, 118, 210, 0.05) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
  border-radius: 8px;
}

.nav-button:hover {
  color: #1976d2;
  transform: translateY(-1px);
}

.nav-button:hover::before {
  opacity: 1;
}

.nav-button:active {
  transform: translateY(0);
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 24px;
}

.cart-link {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #000000;
  position: relative;
}

.cart-text {
  position: relative;
  z-index: 1;
}

.cart-badge {
  background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
  color: white;
  border-radius: 12px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 700;
  min-width: 24px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.3);
  position: relative;
  z-index: 1;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
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

@media (max-width: 768px) {
  .header-nav-content {
    padding: 12px 16px;
  }

  .nav-left {
    gap: 20px;
  }

  .logo {
    height: 36px;
  }

  .nav-button {
    padding: 8px 16px;
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .header-nav-content {
    padding: 10px 12px;
  }

  .nav-left {
    gap: 12px;
  }

  .logo {
    height: 32px;
  }

  .nav-button {
    padding: 8px 12px;
    font-size: 13px;
  }

  .cart-badge {
    font-size: 11px;
    padding: 3px 8px;
    min-width: 20px;
  }
}

@media (max-width: 375px) {
  .logo {
    height: 28px;
  }

  .nav-button {
    padding: 6px 10px;
    font-size: 12px;
  }

  .nav-left {
    gap: 8px;
  }

  .cart-text {
    display: none;
  }

  .cart-link {
    padding: 8px;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    justify-content: center;
  }

  .cart-badge {
    position: absolute;
    top: -2px;
    right: -2px;
    font-size: 10px;
    padding: 2px 6px;
    min-width: 18px;
  }
}
</style>