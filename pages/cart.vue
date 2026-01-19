<template>
  <div class="cart-page">
    <div class="cart-header">
      <h1 class="page-title">Корзина</h1>
      <div v-if="gameShopStore.items.length > 0" class="cart-count">
        {{ gameShopStore.count }} {{ gameShopStore.count === 1 ? 'товар' : gameShopStore.count < 5 ? 'товара' : 'товаров' }}
      </div>
    </div>

    <div v-if="gameShopStore.items.length === 0" class="empty-cart">
      <div class="empty-icon">🛒</div>
      <p class="empty-text">Ваша корзина пуста</p>
      <p class="empty-subtext">Добавьте игры из каталога, чтобы они появились здесь</p>
      <NuxtLink to="/catalog" class="btn btn-primary">Перейти в каталог</NuxtLink>
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
              <span v-if="game.platforms.length > 3" class="platform-more">
                +{{ game.platforms.length - 3 }}
              </span>
            </div>
            
            <div v-if="game.storeName" class="item-store">
              <span class="store-label">Магазин:</span>
              <a 
                  v-if="game.storeURL" 
                  :href="game.storeURL" 
                  target="_blank" 
                  rel="noopener"
                  class="store-link"
              >
                {{ game.storeName }} →
              </a>
              <span v-else class="store-name">{{ game.storeName }}</span>
            </div>
          </div>

          <div class="cart-item-price">
            <div class="price-value">{{ formatPrice(game.price) }}</div>
          </div>

          <button
              class="remove-btn"
              @click="handleRemoveItem(game)"
              title="Удалить из корзины"
          >
            <span class="remove-icon">✕</span>
          </button>
        </div>
      </div>

      <div class="cart-summary">
        <div class="summary-header">
          <h2 class="summary-title">Итого</h2>
        </div>
        <div class="summary-content">
          <div class="summary-row">
            <span class="summary-label">Товаров:</span>
            <span class="summary-value">{{ gameShopStore.count }}</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">Сумма:</span>
            <span class="summary-value">{{ formatPrice(gameShopStore.totalPrice) }}</span>
          </div>
          <div class="summary-divider"></div>
          <div class="summary-row total">
            <span class="summary-label">К оплате:</span>
            <span class="summary-value">{{ formatPrice(gameShopStore.totalPrice) }}</span>
          </div>
        </div>
        <div class="summary-actions">
          <button class="btn btn-checkout" @click="handleCheckout">
            <span class="btn-icon">✓</span>
            Оформить заказ
          </button>
          <button class="btn btn-clear" @click="handleClearCart">
            <span class="btn-icon">🗑</span>
            Очистить корзину
          </button>
        </div>
      </div>
    </div>

    <!-- Модальное окно уведомлений -->
    <NotificationModal
        :is-visible="modalVisible"
        :type="modalType"
        :title="modalTitle"
        :message="modalMessage"
        :confirm-text="modalConfirmText"
        :cancel-text="modalCancelText"
        :show-cancel="modalShowCancel"
        :auto-close="modalAutoClose"
        @close="closeModal"
        @confirm="handleModalConfirm"
        @cancel="closeModal"
    />
  </div>
</template>

<script setup lang="ts">
import { useGameShopStore } from '~/stores/GameShop'
import { getGameImage } from '~/utils/useGameImage'
import NotificationModal from '~/components/UIComponents/NotificationModal.vue'

const gameShopStore = useGameShopStore()

// Состояние модального окна
const modalVisible = ref(false)
const modalType = ref<'success' | 'error' | 'info' | 'warning'>('info')
const modalTitle = ref('')
const modalMessage = ref('')
const modalConfirmText = ref('OK')
const modalCancelText = ref('Отмена')
const modalShowCancel = ref(false)
const modalAutoClose = ref(false)
const pendingAction = ref<(() => void) | null>(null)

const formatPrice = (price?: number | null) => {
  if (typeof price !== 'number' || price === null || price === undefined || price <= 0) {
    return '—'
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price)
}

// Показать модальное окно
const showModal = (
  type: 'success' | 'error' | 'info' | 'warning',
  title: string,
  message?: string,
  options?: {
    confirmText?: string
    cancelText?: string
    showCancel?: boolean
    autoClose?: boolean
    onConfirm?: () => void
  }
) => {
  modalType.value = type
  modalTitle.value = title
  modalMessage.value = message || ''
  modalConfirmText.value = options?.confirmText || 'OK'
  modalCancelText.value = options?.cancelText || 'Отмена'
  modalShowCancel.value = options?.showCancel || false
  modalAutoClose.value = options?.autoClose || false
  pendingAction.value = options?.onConfirm || null
  modalVisible.value = true
}

// Закрыть модальное окно
const closeModal = () => {
  modalVisible.value = false
  pendingAction.value = null
}

// Подтверждение в модальном окне
const handleModalConfirm = () => {
  if (pendingAction.value) {
    pendingAction.value()
  }
}

// Удаление товара из корзины
const handleRemoveItem = (game: any) => {
  showModal(
    'warning',
    'Удалить товар?',
    `Вы уверены, что хотите удалить "${game.name}" из корзины?`,
    {
      confirmText: 'Удалить',
      cancelText: 'Отмена',
      showCancel: true,
      onConfirm: () => {
        gameShopStore.removeFromCart(game.id)
        showModal(
          'success',
          'Товар удален',
          `"${game.name}" удален из корзины`,
          { autoClose: true }
        )
      }
    }
  )
}

// Очистка корзины
const handleClearCart = () => {
  showModal(
    'warning',
    'Очистить корзину?',
    `Вы уверены, что хотите удалить все товары (${gameShopStore.count}) из корзины?`,
    {
      confirmText: 'Очистить',
      cancelText: 'Отмена',
      showCancel: true,
      onConfirm: () => {
        gameShopStore.clearCart()
        showModal(
          'success',
          'Корзина очищена',
          'Все товары удалены из корзины',
          { autoClose: true }
        )
      }
    }
  )
}

// Оформление заказа
const handleCheckout = () => {
  showModal(
    'info',
    'Оформить заказ?',
    `Заказ на сумму ${formatPrice(gameShopStore.totalPrice)} будет оформлен.`,
    {
      confirmText: 'Оформить',
      cancelText: 'Отмена',
      showCancel: true,
      onConfirm: () => {
        // Здесь можно добавить логику оформления заказа
        const orderTotal = gameShopStore.totalPrice
        const orderCount = gameShopStore.count
        gameShopStore.clearCart()
        showModal(
          'success',
          'Заказ оформлен!',
          `Ваш заказ на сумму ${formatPrice(orderTotal)} (${orderCount} ${orderCount === 1 ? 'товар' : orderCount < 5 ? 'товара' : 'товаров'}) успешно оформлен. Спасибо за покупку!`,
          { autoClose: true, autoCloseDelay: 5000 }
        )
      }
    }
  )
}
</script>

<style scoped lang="scss">
.cart-page {
  padding: 24px 0;
  max-width: 1400px;
  margin: 0 auto;
}

.cart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding-bottom: 16px;
  border-bottom: 2px solid #e0e0e0;
}

.page-title {
  font-size: 36px;
  margin: 0;
  font-weight: 700;
  color: #000;
}

.cart-count {
  font-size: 16px;
  color: #666;
  font-weight: 500;
  background: #f5f5f5;
  padding: 8px 16px;
  border-radius: 20px;
}

.empty-cart {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
  background: #f9f9f9;
  border-radius: 16px;
  margin-top: 24px;
}

.empty-icon {
  font-size: 80px;
  margin-bottom: 24px;
  opacity: 0.5;
}

.empty-text {
  font-size: 24px;
  color: #333;
  margin-bottom: 12px;
  font-weight: 600;
}

.empty-subtext {
  font-size: 16px;
  color: #666;
  margin-bottom: 32px;
}

.cart-content {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 32px;
}

.cart-items {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.cart-item {
  display: grid;
  grid-template-columns: 140px 1fr auto auto;
  gap: 20px;
  padding: 20px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 16px;
  align-items: center;
  position: relative;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.cart-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
  border-color: #1976d2;
}

.cart-item-link {
  text-decoration: none;
  display: block;
}

.cart-item-image {
  width: 140px;
  height: 100px;
  border-radius: 12px;
  overflow: hidden;
  background: #ddd;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.item-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.cart-item-link:hover .item-img {
  transform: scale(1.05);
}

.cart-item-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
}

.item-name-link {
  text-decoration: none;
  color: inherit;
}

.item-name {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
  color: #000;
  transition: color 0.2s;
  line-height: 1.3;
}

.item-name-link:hover .item-name {
  color: #1976d2;
}

.item-platforms {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}

.platform-chip {
  background: #e3f2fd;
  color: #1976d2;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}

.platform-more {
  color: #666;
  font-size: 12px;
  font-weight: 500;
}

.item-store {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #666;
}

.store-label {
  font-weight: 500;
}

.store-link {
  color: #1976d2;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

.store-link:hover {
  color: #1565c0;
  text-decoration: underline;
}

.store-name {
  font-weight: 500;
  color: #333;
}

.cart-item-price {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  min-width: 120px;
}

.price-value {
  font-size: 22px;
  font-weight: 700;
  color: #1976d2;
}

.remove-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: #f5f5f5;
  color: #666;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}

.remove-btn:hover {
  background: #ffebee;
  color: #f44336;
  transform: scale(1.1);
}

.remove-icon {
  display: block;
  font-weight: bold;
}

.cart-summary {
  background: white;
  border: 2px solid #e0e0e0;
  padding: 0;
  border-radius: 16px;
  height: fit-content;
  position: sticky;
  top: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.summary-header {
  background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
  padding: 20px 24px;
  color: white;
}

.summary-title {
  font-size: 24px;
  font-weight: 700;
  margin: 0;
  color: white;
}

.summary-content {
  padding: 24px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #e0e0e0;
}

.summary-row:last-of-type {
  border-bottom: none;
}

.summary-divider {
  height: 2px;
  background: linear-gradient(90deg, transparent, #1976d2, transparent);
  margin: 16px 0;
}

.summary-row.total {
  margin-top: 8px;
  padding-top: 16px;
  border-top: 2px solid #1976d2;
  font-size: 20px;
  font-weight: 700;
}

.summary-label {
  color: #666;
  font-size: 16px;
}

.summary-value {
  font-weight: 600;
  color: #000;
  font-size: 16px;
}

.summary-row.total .summary-label {
  color: #333;
  font-size: 20px;
}

.summary-row.total .summary-value {
  color: #1976d2;
  font-size: 28px;
}

.summary-actions {
  padding: 0 24px 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.btn {
  width: 100%;
  padding: 14px 24px;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.3s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  position: relative;
  overflow: hidden;
}

.btn::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.btn:hover::before {
  width: 300px;
  height: 300px;
}

.btn-primary {
  background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(25, 118, 210, 0.3);
}

.btn-primary:hover {
  background: linear-gradient(135deg, #1565c0 0%, #0d47a1 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(25, 118, 210, 0.4);
}

.btn-checkout {
  background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

.btn-checkout:hover {
  background: linear-gradient(135deg, #45a049 0%, #388e3c 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(76, 175, 80, 0.4);
}

.btn-clear {
  background: white;
  color: #d32f2f;
  border: 2px solid #d32f2f;
}

.btn-clear:hover {
  background: #ffebee;
  border-color: #c62828;
  transform: translateY(-2px);
}

.btn-icon {
  font-size: 18px;
  line-height: 1;
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

@media (max-width: 768px) {
  .cart-page {
    padding: 16px;
  }

  .cart-title {
    font-size: 24px;
  }

  .cart-item {
    grid-template-columns: 80px 1fr auto;
    gap: 12px;
    padding: 12px;
  }

  .cart-item-image {
    width: 80px;
    height: 100px;
  }

  .cart-item-name {
    font-size: 15px;
  }

  .cart-item-price {
    font-size: 16px;
  }

  .cart-summary {
    padding: 16px;
  }

  .cart-summary-title {
    font-size: 18px;
  }

  .cart-total {
    font-size: 20px;
  }

  .btn {
    padding: 10px 20px;
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .cart-page {
    padding: 12px;
  }

  .cart-title {
    font-size: 20px;
  }

  .cart-item {
    grid-template-columns: 70px 1fr auto;
    gap: 10px;
    padding: 10px;
  }

  .cart-item-image {
    width: 70px;
    height: 90px;
  }

  .cart-item-name {
    font-size: 14px;
  }

  .cart-item-price {
    font-size: 15px;
  }

  .remove-btn {
    width: 32px;
    height: 32px;
    font-size: 16px;
  }

  .cart-summary {
    padding: 12px;
  }

  .cart-summary-title {
    font-size: 16px;
  }

  .cart-total {
    font-size: 18px;
  }

  .btn {
    padding: 10px 16px;
    font-size: 13px;
  }

  .empty-cart-title {
    font-size: 20px;
  }

  .empty-cart-message {
    font-size: 14px;
  }
}

@media (max-width: 375px) {
  .cart-page {
    padding: 10px;
  }

  .cart-title {
    font-size: 18px;
  }

  .cart-item {
    grid-template-columns: 60px 1fr auto;
    gap: 8px;
    padding: 8px;
  }

  .cart-item-image {
    width: 60px;
    height: 80px;
  }

  .cart-item-name {
    font-size: 13px;
  }

  .cart-item-price {
    font-size: 14px;
  }

  .remove-btn {
    width: 28px;
    height: 28px;
    font-size: 14px;
  }

  .cart-summary {
    padding: 10px;
  }

  .cart-summary-title {
    font-size: 15px;
  }

  .cart-total {
    font-size: 16px;
  }

  .btn {
    padding: 8px 14px;
    font-size: 12px;
  }
}
</style>

