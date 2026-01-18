import { defineStore } from 'pinia'

export interface CartGame {
  id: number
  slug: string
  name: string
  price: number
  backgroundImage: string | null
  platforms: string[]
  storeName?: string
  storeURL?: string
}

const CART_STORAGE_KEY = 'gameshop_cart'

// Функция для сохранения корзины в sessionStorage
const saveCartToStorage = (cartItems: CartGame[]) => {
  if (process.client) {
    try {
      sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems))
    } catch (error) {
      console.error('Ошибка при сохранении корзины в sessionStorage:', error)
    }
  }
}

// Функция для восстановления корзины из sessionStorage
const loadCartFromStorage = (): CartGame[] => {
  if (process.client) {
    try {
      const savedCart = sessionStorage.getItem(CART_STORAGE_KEY)
      if (savedCart) {
        return JSON.parse(savedCart) as CartGame[]
      }
    } catch (error) {
      console.error('Ошибка при загрузке корзины из sessionStorage:', error)
    }
  }
  return []
}

export const useGameShopStore = defineStore('gameShop', () => {
  // State - инициализируем из sessionStorage если доступно
  const items = ref<CartGame[]>(loadCartFromStorage())

  // Getters
  const count = computed(() => items.value.length)
  
  const totalPrice = computed(() => 
    items.value.reduce((sum, item) => sum + item.price, 0)
  )

  // Actions
  const addToCart = (game: CartGame) => {
    // Проверяем, нет ли уже этой игры в корзине
    const existingIndex = items.value.findIndex(item => item.id === game.id)
    if (existingIndex === -1) {
      items.value.push(game)
      saveCartToStorage(items.value)
    }
  }

  const removeFromCart = (gameId: number) => {
    const index = items.value.findIndex(item => item.id === gameId)
    if (index !== -1) {
      items.value.splice(index, 1)
      saveCartToStorage(items.value)
    }
  }

  const clearCart = () => {
    items.value = []
    saveCartToStorage(items.value)
    // Также очищаем sessionStorage
    if (process.client) {
      try {
        sessionStorage.removeItem(CART_STORAGE_KEY)
      } catch (error) {
        console.error('Ошибка при очистке корзины из sessionStorage:', error)
      }
    }
  }

  const isInCart = (gameId: number) => {
    return items.value.some(item => item.id === gameId)
  }

  return {
    items,
    count,
    totalPrice,
    addToCart,
    removeFromCart,
    clearCart,
    isInCart
  }
})

