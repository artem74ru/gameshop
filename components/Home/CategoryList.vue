<template>
  <div class="category-wrapper">
    <NuxtLink
        v-for="c in categories"
        :key="c.id"
        :to="`/catalog?genres=${c.id}`"
        class="category-btn"
        :style="getCategoryStyle(c)"
    >
      {{ c.name }}
    </NuxtLink>
    <!-- Последняя кнопка - ссылка на каталог -->
    <NuxtLink
        to="/catalog"
        class="category-btn category-btn-catalog"
    >
      Перейти в каталог
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
interface Category {
  id: number
  name: string
  slug: string
}

const props = defineProps<{
  categories: Category[]
}>()

// Функция для получения стиля категории с фоновым изображением
const getCategoryStyle = (category: Category) => {
  // Пробуем загрузить изображение по slug
  // Поддерживаем форматы: jpg, png, webp
  // Если файла нет, будет использован fallback цвет из CSS
  const imagePath = `/images/genres/${category.slug}.jpg`
  
  return {
    backgroundImage: `url(${imagePath})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat'
  }
}
</script>

<style scoped>
.category-wrapper {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(4, 1fr);
  gap: 20px;
}

.category-btn {
  width: 100%;
  height: 160px;
  border-radius: 10px;
  background: #dcdcdc;
  border: none;
  font-size: 16px;
  font-weight: 500;
  text-decoration: none;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
  padding: 0 16px;
  box-sizing: border-box;
  position: relative;
  overflow: hidden;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  font-weight: 600;
  z-index: 1;
}

.category-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  transition: background 0.2s;
  z-index: -1;
}

.category-btn:hover::before {
  background: rgba(0, 0, 0, 0.3);
}

.category-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.category-btn-catalog {
  background: #FF8989 !important;
  background-image: none !important;
  color: #FFFFFF;
  font-weight: 600;
}

.category-btn-catalog:hover {
  background: #ff7070 !important;
  background-image: none !important;
  color: #FFFFFF;
}

.category-btn-catalog::before {
  display: none !important;
}

@media (max-width: 1024px) {
  .category-wrapper {
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(6, 1fr);
  }
}

@media (max-width: 640px) {
  .category-wrapper {
    grid-template-columns: 1fr;
    grid-template-rows: auto;
  }
  
  .category-btn {
    height: 120px;
    font-size: 14px;
  }
}
</style>
