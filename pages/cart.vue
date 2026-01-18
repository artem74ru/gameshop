<template>
  <div class="cart-page">
    <h1 class="page-title">Корзина</h1>

    <div v-if="gameShopStore.items.length === 0" class="empty-cart">
      <p class="empty-text">Ваша корзина пуста</p>
      <NuxtLink to="/" class="btn btn-primary">Перейти в каталог</NuxtLink>
    </div>

    <div v-else class="cart-content">
      <div class="cart-items">
        <div
            v-for="game in gameShopStore.items"
            :key="game.id"
            class="cart-item"
        >
          <NuxtLink :to="`/game/${game.slug}`" class="cart-item-link">
            <div class="cart-item-image">
              <img
                  :src="getGameImage(game)"
                  :alt="game.name"
                  class="item-img"
              />
            </div>
          </NuxtLink>

          <div class="cart-item-info">
            <NuxtLink :to="`/game/${game.slug}`" class="item-name-link">
              <h3 class="item-name">{{ game.name }}</h3>
            </NuxtLink>

            <div class="item-platforms">
              <span
                  v-for="platform in game.platforms.slice(0, 3)"
                  :key="platform"
                  class="platform-chip"
              >
                {{ platform }}
              </span>
            </div>
          </div>

          <div class="cart-item-price">
            <div class="price-value">{{ formatPrice(game.price) }}</div>
            <a 
                v-if="game.storeName && game.storeURL" 
                :href="game.storeURL" 
                target="_blank" 
                rel="noopener"
                class="price-source-link"
            >
              {{ game.storeName }}
            </a>
            <div v-else-if="game.storeName" class="price-source">{{ game.storeName }}</div>
          </div>

          <button
              class="remove-btn"
              @click="gameShopStore.removeFromCart(game.id)"
              title="Удалить из корзины"
          >
            ×
          </button>
        </div>
      </div>

      <div class="cart-summary">
        <div class="summary-row">
          <span class="summary-label">Товаров:</span>
          <span class="summary-value">{{ gameShopStore.count }}</span>
        </div>
        <div class="summary-row total">
          <span class="summary-label">Итого:</span>
          <span class="summary-value">{{ formatPrice(gameShopStore.totalPrice) }}</span>
        </div>
        <button class="btn btn-checkout" @click="checkout">
          Оформить заказ
        </button>
        <button class="btn btn-clear" @click="clearCart">
          Очистить корзину
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useGameShopStore } from '~/stores/GameShop'
import { getGameImage } from '~/utils/useGameImage'

const gameShopStore = useGameShopStore()

const formatPrice = (price?: number | null) => {
  if (typeof price !== 'number' || price === null || price === undefined || price <= 0) {
    return '—'
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price)
}

const clearCart = () => {
  if (confirm('Вы уверены, что хотите очистить корзину?')) {
    gameShopStore.clearCart()
  }
}

const checkout = () => {
  alert(`Заказ на сумму ${formatPrice(gameShopStore.totalPrice)} оформлен!`)
  gameShopStore.clearCart()
}
</script>

<style scoped lang="scss">
.cart-page {
  padding: 24px 0;
}

.page-title {
  font-size: 32px;
  margin: 0 0 24px;
  font-weight: 600;
}

.empty-cart {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.empty-text {
  font-size: 18px;
  color: #666;
  margin-bottom: 24px;
}

.cart-content {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 24px;
}

.cart-items {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.cart-item {
  display: grid;
  grid-template-columns: 120px 1fr auto auto;
  gap: 16px;
  padding: 16px;
  background: #f5f5f5;
  border-radius: 12px;
  align-items: center;
  position: relative;
}

.cart-item-link {
  text-decoration: none;
  display: block;
}

.cart-item-image {
  width: 120px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  background: #ddd;
}

.item-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cart-item-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.item-name-link {
  text-decoration: none;
  color: inherit;
}

.item-name {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: #000;
  transition: color 0.2s;
}

.item-name-link:hover .item-name {
  color: #1976d2;
}

.item-platforms {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.platform-chip {
  background: #e0e0e0;
  color: #424242;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.cart-item-price {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.price-value {
  font-size: 18px;
  font-weight: 700;
  color: #1976d2;
}

.price-source {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.price-source-link {
  font-size: 12px;
  color: #1976d2;
  font-weight: 500;
  text-decoration: none;
  transition: color 0.2s;
}

.price-source-link:hover {
  color: #1565c0;
  text-decoration: underline;
}

.remove-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: #666;
  font-size: 28px;
  line-height: 1;
  cursor: pointer;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.remove-btn:hover {
  background: rgba(255, 0, 0, 0.1);
  color: #d32f2f;
}

.cart-summary {
  background: #f5f5f5;
  padding: 24px;
  border-radius: 12px;
  height: fit-content;
  position: sticky;
  top: 24px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #ddd;
}

.summary-row.total {
  border-bottom: 2px solid #1976d2;
  margin-bottom: 16px;
  font-size: 20px;
  font-weight: 700;
}

.summary-label {
  color: #666;
}

.summary-value {
  font-weight: 600;
  color: #000;
}

.summary-row.total .summary-value {
  color: #1976d2;
  font-size: 24px;
}

.btn {
  width: 100%;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}

.btn:last-child {
  margin-bottom: 0;
}

.btn-primary {
  background: #1976d2;
  color: white;
}

.btn-primary:hover {
  background: #1565c0;
}

.btn-checkout {
  background: #4caf50;
  color: white;
  margin-top: 8px;
}

.btn-checkout:hover {
  background: #45a049;
}

.btn-clear {
  background: transparent;
  color: #d32f2f;
  border: 1px solid #d32f2f;
}

.btn-clear:hover {
  background: rgba(211, 47, 47, 0.1);
}

@media (max-width: 960px) {
  .cart-content {
    grid-template-columns: 1fr;
  }

  .cart-item {
    grid-template-columns: 100px 1fr auto;
    grid-template-rows: auto auto;
  }

  .cart-item-price {
    grid-column: 2;
    grid-row: 2;
  }

  .remove-btn {
    grid-column: 3;
    grid-row: 1 / 3;
  }

  .cart-summary {
    position: static;
  }
}
</style>

