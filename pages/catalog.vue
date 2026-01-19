<template>
  <div class="catalog-page">
    <div class="page-header">
      <h1 class="page-title">Каталог игр</h1>
      
      <!-- Переключатель режима -->
      <div class="mode-switcher">
        <label class="mode-label">Режим загрузки:</label>
        <div class="mode-buttons">
          <button
              :class="['mode-btn', { active: viewMode === 'pagination' }]"
              @click="setViewMode('pagination')"
          >
            Пагинация
          </button>
          <button
              :class="['mode-btn', { active: viewMode === 'infinite' }]"
              @click="setViewMode('infinite')"
          >
            Бесконечный скролл
          </button>
        </div>
      </div>
    </div>

    <div class="catalog-layout">
      <!-- Фильтры -->
      <aside class="filters-sidebar">
        <div class="filters-header">
          <h2>Фильтры</h2>
          <button class="clear-filters" @click="clearAllFilters">
            Сбросить
          </button>
        </div>

        <!-- Поиск -->
        <div class="filter-group">
          <label class="filter-label">Поиск</label>
          <input
              v-model="gamesStore.search"
              type="text"
              placeholder="Название игры..."
              class="search-input"
              @input="handleSearch"
          />
        </div>

        <!-- Сортировка -->
        <div class="filter-group">
          <label class="filter-label">Сортировка</label>
          <select v-model="gamesStore.sort" class="filter-select" @change="handleSortChange">
            <option value="">По умолчанию</option>
            <option value="rating_desc">Рейтинг: по убыванию</option>
            <option value="rating_asc">Рейтинг: по возрастанию</option>
            <option value="release_desc">Дата релиза: новые</option>
            <option value="release_asc">Дата релиза: старые</option>
            <option value="name_asc">Название: А-Я</option>
            <option value="name_desc">Название: Я-А</option>
            <option value="metacritic_desc">Metacritic: высокий</option>
            <option value="metacritic_asc">Metacritic: низкий</option>
          </select>
        </div>

        <!-- Платформы -->
        <div class="filter-group">
          <label class="filter-label">Платформы</label>
          <div class="checkbox-group">
            <label
                v-for="platform in platforms"
                :key="platform.id"
                class="checkbox-label"
            >
              <input
                  type="checkbox"
                  :value="platform.id"
                  :checked="selectedPlatforms.includes(platform.id)"
                  @change="togglePlatform(platform.id)"
              />
              <span>{{ platform.name }}</span>
            </label>
          </div>
        </div>

        <!-- Жанры -->
        <div class="filter-group">
          <label class="filter-label">Жанры</label>
          <div class="checkbox-group">
            <label
                v-for="genre in genres"
                :key="genre.id"
                class="checkbox-label"
            >
              <input
                  type="checkbox"
                  :value="genre.id"
                  :checked="selectedGenres.includes(genre.id)"
                  @change="toggleGenre(genre.id)"
              />
              <span>{{ genre.name }} ({{ genre.gamesCount }})</span>
            </label>
          </div>
        </div>

        <!-- Издатели -->
        <div class="filter-group">
          <label class="filter-label">Издатели</label>
          <div class="checkbox-group">
            <label
                v-for="publisher in publishers"
                :key="publisher.id"
                class="checkbox-label"
            >
              <input
                  type="checkbox"
                  :value="publisher.id"
                  :checked="selectedPublishers.includes(publisher.id)"
                  @change="togglePublisher(publisher.id)"
              />
              <span>{{ publisher.name }} ({{ publisher.gamesCount }})</span>
            </label>
          </div>
        </div>

        <!-- Разработчики -->
        <div class="filter-group">
          <label class="filter-label">Разработчики</label>
          <div class="checkbox-group">
            <label
                v-for="developer in developers"
                :key="developer.id"
                class="checkbox-label"
            >
              <input
                  type="checkbox"
                  :value="developer.id"
                  :checked="selectedDevelopers.includes(developer.id)"
                  @change="toggleDeveloper(developer.id)"
              />
              <span>{{ developer.name }} ({{ developer.gamesCount }})</span>
            </label>
          </div>
        </div>

        <!-- Магазины -->
        <div class="filter-group">
          <label class="filter-label">Магазины</label>
          <div class="checkbox-group">
            <label
                v-for="store in gameStores"
                :key="store.id"
                class="checkbox-label"
            >
              <input
                  type="checkbox"
                  :value="store.id"
                  :checked="selectedStores.includes(store.id)"
                  @change="toggleStore(store.id)"
              />
              <span>{{ store.name }} ({{ store.gamesCount }})</span>
            </label>
          </div>
        </div>

        <!-- Теги -->
        <div class="filter-group">
          <label class="filter-label">Теги</label>
          <div class="checkbox-group">
            <label
                v-for="tag in gameTags"
                :key="tag.id"
                class="checkbox-label"
            >
              <input
                  type="checkbox"
                  :value="tag.id"
                  :checked="selectedTags.includes(tag.id)"
                  @change="toggleTag(tag.id)"
              />
              <span>{{ tag.name }} ({{ tag.gamesCount }})</span>
            </label>
          </div>
        </div>

        <!-- Рейтинг -->
        <div class="filter-group">
          <label class="filter-label">Рейтинг</label>
          <div class="rating-range">
            <input
                v-model="ratingMin"
                type="number"
                placeholder="От"
                min="0"
                max="5"
                step="0.1"
                class="rating-input"
                @change="updateRating"
            />
            <span class="rating-separator">—</span>
            <input
                v-model="ratingMax"
                type="number"
                placeholder="До"
                min="0"
                max="5"
                step="0.1"
                class="rating-input"
                @change="updateRating"
            />
          </div>
        </div>

        <!-- Год релиза -->
        <div class="filter-group">
          <label class="filter-label">Год релиза</label>
          <div class="date-range">
            <input
                v-model="dateFrom"
                type="number"
                placeholder="От"
                min="1970"
                :max="currentYear"
                class="date-input"
                @change="updateDates"
            />
            <span class="date-separator">—</span>
            <input
                v-model="dateTo"
                type="number"
                placeholder="До"
                min="1970"
                :max="currentYear + 1"
                class="date-input"
                @change="updateDates"
            />
          </div>
        </div>
      </aside>

      <!-- Контент -->
      <div class="catalog-content">
        <!-- Информация о результатах -->
        <div class="results-info">
          <p v-if="gamesStore.loading && viewMode === 'pagination'">Загрузка...</p>
          <p v-else-if="gamesStore.loading && viewMode === 'infinite' && allGames.length === 0">
            Загрузка...
          </p>
          <p v-else>
            Показано игр: <strong>{{ totalFilteredCount }}</strong>
            <span v-if="viewMode === 'infinite'">
              (Загружено: {{ allGames.length }})
            </span>
          </p>
        </div>

        <!-- Ошибка -->
        <div v-if="gamesStore.error" class="error-message">
          {{ gamesStore.error }}
        </div>

        <!-- Список игр -->
        <div 
            v-if="displayedGames.length > 0 || gamesStore.loading" 
            class="games-grid"
            :class="{ 'infinite-mode': viewMode === 'infinite' }"
        >
          <template v-if="gamesStore.loading && displayedGames.length === 0">
            <SkeletonCard v-for="i in 12" :key="`skeleton-${i}`" />
          </template>
          <GameCard
              v-for="game in displayedGames"
              :key="game.id"
              :game="game"
          />
        </div>

        <!-- Пусто -->
        <div v-if="!gamesStore.loading && displayedGames.length === 0 && gamesStore.games.length === 0 && allGames.length === 0" class="empty-state">
          <p>Игры не найдены. Попробуйте изменить фильтры.</p>
        </div>

        <!-- Пагинация -->
        <div v-if="viewMode === 'pagination' && totalPages > 1" class="pagination">
          <button
              class="pagination-btn"
              :disabled="gamesStore.page === 1"
              @click="goToPage(gamesStore.page - 1)"
          >
            Назад
          </button>
          <span class="pagination-info">
            Страница {{ gamesStore.page }} из {{ totalPages }}
          </span>
          <button
              class="pagination-btn"
              :disabled="gamesStore.page >= totalPages"
              @click="goToPage(gamesStore.page + 1)"
          >
            Вперед
          </button>
        </div>

        <!-- Индикатор загрузки для infinite scroll -->
        <div v-if="viewMode === 'infinite' && gamesStore.loading && allGames.length > 0" class="infinite-loading">
          <div class="loading-spinner"></div>
          <p>Загрузка игр...</p>
        </div>

        <!-- Сообщение о конце списка для infinite scroll -->
        <div v-if="viewMode === 'infinite' && !gamesStore.loading && allGames.length >= gamesStore.total && allGames.length > 0" class="infinite-end">
          <p>Все игры загружены</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useGamesStore } from '~/stores/games'
import GameCard from '~/components/Home/GameCard.vue'

const gamesStore = useGamesStore()
const route = useRoute()
const router = useRouter()

// Режим просмотра (pagination или infinite)
const viewMode = ref<'pagination' | 'infinite'>('infinite')

// Для infinite scroll - накапливаем все игры
const allGames = ref<any[]>([])

// Для подсчета общего количества отфильтрованных игр
const filteredGamesForCount = ref<any[]>([])

// Выбранные фильтры (объявляем до использования)
const selectedPlatforms = ref<number[]>([])
const selectedGenres = ref<number[]>([])
const selectedPublishers = ref<number[]>([])
const selectedDevelopers = ref<number[]>([])
const selectedStores = ref<number[]>([])
const selectedTags = ref<number[]>([])
const dateFrom = ref<number | null>(null)
const dateTo = ref<number | null>(null)
const ratingMin = ref<string>('')
const ratingMax = ref<string>('')
const currentYear = new Date().getFullYear()

// Инициализация режима из query параметра
  const mode = route.query.mode as 'pagination' | 'infinite' | undefined
  if (mode === 'pagination' || mode === 'infinite') {
    viewMode.value = mode
  } else {
    // По умолчанию используем infinite scroll
    viewMode.value = 'infinite'
  }
  
// Инициализация фильтров из query параметров (до onMounted для SSR)
  if (route.query.genres) {
    const genreIds = String(route.query.genres).split(',').map(Number).filter(n => !isNaN(n))
    selectedGenres.value = genreIds
    gamesStore.genres = genreIds.join(',')
  }
  
  if (route.query.platforms) {
    const platformIds = String(route.query.platforms).split(',').map(Number).filter(n => !isNaN(n))
    selectedPlatforms.value = platformIds
    gamesStore.platforms = platformIds.join(',')
  }
  
  if (route.query.publishers) {
    const publisherIds = String(route.query.publishers).split(',').map(Number).filter(n => !isNaN(n))
    selectedPublishers.value = publisherIds
    gamesStore.publishers = publisherIds.join(',')
  }
  
  if (route.query.developers) {
    const developerIds = String(route.query.developers).split(',').map(Number).filter(n => !isNaN(n))
    selectedDevelopers.value = developerIds
    gamesStore.developers = developerIds.join(',')
  }
  
  if (route.query.stores) {
    const storeIds = String(route.query.stores).split(',').map(Number).filter(n => !isNaN(n))
    selectedStores.value = storeIds
    gamesStore.stores = storeIds.join(',')
  }
  
  if (route.query.tags) {
    const tagIds = String(route.query.tags).split(',').map(Number).filter(n => !isNaN(n))
    selectedTags.value = tagIds
    gamesStore.tags = tagIds.join(',')
  }
  
  if (route.query.rating) {
    const [min, max] = String(route.query.rating).split(',')
    if (min) ratingMin.value = min
    if (max) ratingMax.value = max
    gamesStore.ratingMin = min || ''
    gamesStore.ratingMax = max || ''
  }
  
  if (route.query.search) {
    gamesStore.search = String(route.query.search)
  }
  
  if (route.query.sort) {
    gamesStore.sort = String(route.query.sort)
  }
  
  if (route.query.page && viewMode.value === 'pagination') {
    gamesStore.page = Number(route.query.page) || 1
  }
  
// Флаг для отслеживания, были ли загружены данные
const hasLoadedInitialData = ref(false)

// Инициализация перед монтированием компонента
onBeforeMount(() => {
  if (!process.client) return
  
  // Восстанавливаем состояние из sessionStorage если есть
  if (viewMode.value === 'infinite') {
    const savedCount = sessionStorage.getItem('catalog_games_count')
    if (savedCount) {
      const count = Number(savedCount)
      if (count > 0) {
        // Восстанавливаем количество игр для правильной работы infinite scroll
        // (сами игры будут загружены в onMounted)
      }
    }
  }
  
  // Восстанавливаем выбранные фильтры из URL если они есть
  syncFiltersFromQuery()
})

// Синхронизация фильтров из query параметров
const syncFiltersFromQuery = () => {
  if (route.query.genres) {
    const genreIds = String(route.query.genres).split(',').map(Number).filter(n => !isNaN(n))
    selectedGenres.value = genreIds
    gamesStore.genres = genreIds.join(',')
  }
  
  if (route.query.platforms) {
    const platformIds = String(route.query.platforms).split(',').map(Number).filter(n => !isNaN(n))
    selectedPlatforms.value = platformIds
    gamesStore.platforms = platformIds.join(',')
  }
  
  if (route.query.publishers) {
    const publisherIds = String(route.query.publishers).split(',').map(Number).filter(n => !isNaN(n))
    selectedPublishers.value = publisherIds
    gamesStore.publishers = publisherIds.join(',')
  }
  
  if (route.query.developers) {
    const developerIds = String(route.query.developers).split(',').map(Number).filter(n => !isNaN(n))
    selectedDevelopers.value = developerIds
    gamesStore.developers = developerIds.join(',')
  }
  
  if (route.query.stores) {
    const storeIds = String(route.query.stores).split(',').map(Number).filter(n => !isNaN(n))
    selectedStores.value = storeIds
    gamesStore.stores = storeIds.join(',')
  }
  
  if (route.query.tags) {
    const tagIds = String(route.query.tags).split(',').map(Number).filter(n => !isNaN(n))
    selectedTags.value = tagIds
    gamesStore.tags = tagIds.join(',')
  }
  
  if (route.query.rating) {
    const [min, max] = String(route.query.rating).split(',')
    if (min) ratingMin.value = min
    if (max) ratingMax.value = max
    gamesStore.ratingMin = min || ''
    gamesStore.ratingMax = max || ''
  }
  
  if (route.query.search) {
    gamesStore.search = String(route.query.search)
  }
  
  if (route.query.sort) {
    gamesStore.sort = String(route.query.sort)
  }
  
  if (route.query.page && viewMode.value === 'pagination') {
    gamesStore.page = Number(route.query.page) || 1
  }
  
  // Обработка дат
  if (route.query.dates) {
    const dates = String(route.query.dates)
    gamesStore.dates = dates
    // Парсим даты для отображения в полях
    const [from, to] = dates.split(',')
    if (from) {
      const fromYear = new Date(from).getFullYear()
      if (!isNaN(fromYear)) dateFrom.value = fromYear
    }
    if (to) {
      const toYear = new Date(to).getFullYear()
      if (!isNaN(toYear)) dateTo.value = toYear
    }
  }
}

// Загружаем данные при инициализации
onMounted(async () => {
  // Для infinite scroll добавляем обработчик скролла сразу
  if (viewMode.value === 'infinite' && process.client) {
    window.addEventListener('scroll', handleScroll)
  }
  
  // Восстанавливаем состояние скролла для infinite mode
  if (viewMode.value === 'infinite') {
    const savedPosition = sessionStorage.getItem('catalog_scroll_position')
    const savedCount = sessionStorage.getItem('catalog_games_count')
    
    if (savedPosition && savedCount && allGames.value.length > 0) {
      // Есть сохраненная позиция и данные уже загружены - восстанавливаем
      restoreScrollPosition()
      hasLoadedInitialData.value = true
      return // Не загружаем заново, если восстанавливаем позицию
    }
  }
  
  // Загружаем данные если их еще нет (включая случай возврата назад)
  if (allGames.value.length === 0 && gamesStore.games.length === 0) {
    // Если есть query параметры (например, genres), помечаем что фильтры изменились
    if (route.query.genres || route.query.platforms || route.query.publishers || 
        route.query.developers || route.query.stores || route.query.tags || 
        route.query.search || route.query.sort) {
      filtersChanged.value = true
    } else {
      filtersChanged.value = false
    }
    hasLoadedInitialData.value = true
    await applyFilters()
    // Загружаем данные для подсчета общего количества только при первой загрузке
    loadFilteredCount()
  } else {
    hasLoadedInitialData.value = true
  }
})

// Устанавливаем режим просмотра
const setViewMode = (mode: 'pagination' | 'infinite') => {
  viewMode.value = mode
  
  // Обновляем URL
  const query: Record<string, any> = {
    ...route.query,
    mode,
    page: mode === 'pagination' ? gamesStore.page : undefined
  }
  if (gamesStore.publishers) query.publishers = gamesStore.publishers
  router.push({ query })
  
  // Сбрасываем состояние при переключении режима
  if (mode === 'pagination') {
    allGames.value = []
    gamesStore.page = 1
  } else {
    allGames.value = []
    gamesStore.page = 1
  }
  
  applyFilters()
}

// Отображаемые игры
const displayedGames = computed(() => {
  let games = viewMode.value === 'infinite' ? allGames.value : gamesStore.games
  
  // Если игр нет, возвращаем пустой массив
  if (!games || games.length === 0) {
    return []
  }
  
  return games
})

// Коэффициент фильтрации (сколько игр проходит фильтр 18+)
const filterRatio = ref<number>(1)

// Общее количество отфильтрованных игр
const totalFilteredCount = computed(() => {
  return gamesStore.total
})

// Загрузка игр для подсчета общего количества отфильтрованных
const loadFilteredCount = async () => {
  if (!process.client) return
  
  try {
    const query: Record<string, any> = {
      page: 1,
      pageSize: 200, // Загружаем больше игр для более точного подсчета
    }
    
    if (gamesStore.search) query.search = gamesStore.search
    if (gamesStore.sort) query.sort = gamesStore.sort
    if (gamesStore.platforms) query.platforms = gamesStore.platforms
    if (gamesStore.genres) query.genres = gamesStore.genres
    if (gamesStore.publishers) query.publishers = gamesStore.publishers
    if (gamesStore.developers) query.developers = gamesStore.developers
    if (gamesStore.stores) query.stores = gamesStore.stores
    if (gamesStore.tags) query.tags = gamesStore.tags
    if (gamesStore.dates) query.dates = gamesStore.dates
    if (gamesStore.metacritic) query.metacritic = gamesStore.metacritic
    if (gamesStore.ratingMin || gamesStore.ratingMax) {
      const min = gamesStore.ratingMin || '0'
      const max = gamesStore.ratingMax || '5'
      query.rating = `${min},${max}`
    }
    
    const data = await $fetch('/api/games', { query })
    
    if (data) {
      const response = data as { results: any[]; total: number }
      // Сохраняем первые 200 игр для подсчета
      filteredGamesForCount.value = response.results
    }
  } catch (e) {
    console.error('Ошибка при загрузке игр для подсчета:', e)
  }
}

// Платформы - загружаем лениво (lazy) чтобы не блокировать загрузку страницы
const { data: platformsData } = await useFetch('/api/platforms', { 
    lazy: true,
    server: false // Загружаем на клиенте для ускорения SSR
})
const platforms = computed(() => platformsData.value?.results || [])

// Жанры - загружаем лениво
const { data: genresData } = await useFetch('/api/genres', { 
    lazy: true,
    server: false
})
const genres = computed(() => genresData.value?.results || [])

// Издатели - загружаем лениво
const { data: publishersData } = await useFetch('/api/publishers', { 
    lazy: true,
    server: false
})
const publishers = computed(() => publishersData.value?.results || [])

// Разработчики - загружаем лениво
const { data: developersData } = await useFetch('/api/developers', { 
    lazy: true,
    server: false
})
const developers = computed(() => developersData.value?.results || [])

// Магазины - загружаем лениво
const { data: storesData } = await useFetch('/api/stores', { 
    lazy: true,
    server: false
})
const gameStores = computed(() => storesData.value?.results || [])

// Теги - загружаем лениво
const { data: tagsData } = await useFetch('/api/tags', { 
    lazy: true,
    server: false
})
const gameTags = computed(() => tagsData.value?.results || [])

// Debounce для поиска
let searchTimeout: NodeJS.Timeout | null = null

const handleSearch = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    filtersChanged.value = true
    gamesStore.page = 1
    allGames.value = []
    applyFilters()
  }, 500)
}

const handleSortChange = () => {
  filtersChanged.value = true
  gamesStore.page = 1
  allGames.value = []
  applyFilters()
}

const togglePlatform = (platformId: number) => {
  const index = selectedPlatforms.value.indexOf(platformId)
  if (index > -1) {
    selectedPlatforms.value.splice(index, 1)
  } else {
    selectedPlatforms.value.push(platformId)
  }
  filtersChanged.value = true
  gamesStore.platforms = selectedPlatforms.value.join(',')
  gamesStore.page = 1
  allGames.value = []
  applyFilters()
}

const toggleGenre = (genreId: number) => {
  const index = selectedGenres.value.indexOf(genreId)
  if (index > -1) {
    selectedGenres.value.splice(index, 1)
  } else {
    selectedGenres.value.push(genreId)
  }
  filtersChanged.value = true
  gamesStore.genres = selectedGenres.value.join(',')
  gamesStore.page = 1
  allGames.value = []
  applyFilters()
}

const togglePublisher = (publisherId: number) => {
  const index = selectedPublishers.value.indexOf(publisherId)
  if (index > -1) {
    selectedPublishers.value.splice(index, 1)
  } else {
    selectedPublishers.value.push(publisherId)
  }
  filtersChanged.value = true
  gamesStore.publishers = selectedPublishers.value.join(',')
  gamesStore.page = 1
  allGames.value = []
  applyFilters()
}

const toggleDeveloper = (developerId: number) => {
  const index = selectedDevelopers.value.indexOf(developerId)
  if (index > -1) {
    selectedDevelopers.value.splice(index, 1)
  } else {
    selectedDevelopers.value.push(developerId)
  }
  filtersChanged.value = true
  gamesStore.developers = selectedDevelopers.value.join(',')
  gamesStore.page = 1
  allGames.value = []
  applyFilters()
}

const toggleStore = (storeId: number) => {
  const index = selectedStores.value.indexOf(storeId)
  if (index > -1) {
    selectedStores.value.splice(index, 1)
  } else {
    selectedStores.value.push(storeId)
  }
  filtersChanged.value = true
  gamesStore.stores = selectedStores.value.join(',')
  gamesStore.page = 1
  allGames.value = []
  applyFilters()
}

const toggleTag = (tagId: number) => {
  const index = selectedTags.value.indexOf(tagId)
  if (index > -1) {
    selectedTags.value.splice(index, 1)
  } else {
    selectedTags.value.push(tagId)
  }
  filtersChanged.value = true
  gamesStore.tags = selectedTags.value.join(',')
  gamesStore.page = 1
  allGames.value = []
  applyFilters()
}

const updateRating = () => {
  gamesStore.ratingMin = ratingMin.value
  gamesStore.ratingMax = ratingMax.value
  filtersChanged.value = true
  gamesStore.page = 1
  allGames.value = []
  applyFilters()
}

const updateDates = () => {
  if (dateFrom.value && dateTo.value) {
    gamesStore.dates = `${dateFrom.value}-01-01,${dateTo.value}-12-31`
  } else if (dateFrom.value) {
    gamesStore.dates = `${dateFrom.value}-01-01,${currentYear + 1}-12-31`
  } else if (dateTo.value) {
    gamesStore.dates = `1970-01-01,${dateTo.value}-12-31`
  } else {
    gamesStore.dates = ''
  }
  filtersChanged.value = true
  gamesStore.page = 1
  allGames.value = []
  applyFilters()
}

// Флаг для отслеживания изменений фильтров (не пагинации)
const filtersChanged = ref(false)

const applyFilters = async () => {
  // Определяем, изменились ли фильтры (не только страница)
  const currentFilters = {
    search: gamesStore.search,
    sort: gamesStore.sort,
    platforms: gamesStore.platforms,
    genres: gamesStore.genres,
    dates: gamesStore.dates,
    metacritic: gamesStore.metacritic
  }
  
  // Если фильтры изменились, пересчитываем общее количество
  if (filtersChanged.value) {
    filtersChanged.value = false
    // Перезагружаем данные для подсчета при изменении фильтров
    if (process.client) {
      loadFilteredCount()
    }
  }
  
  if (viewMode.value === 'pagination') {
    // Обновляем URL для пагинации
    if (process.client) {
      router.push({
        query: {
          ...route.query,
          mode: 'pagination',
          page: gamesStore.page,
          search: gamesStore.search || undefined,
          sort: gamesStore.sort || undefined,
          platforms: gamesStore.platforms || undefined,
          genres: gamesStore.genres || undefined
        }
      })
    }
    // Загружаем игры
    await gamesStore.fetchGames().catch(err => {
      console.error('Ошибка при загрузке игр:', err)
      gamesStore.error = 'Ошибка при загрузке игр'
    })
  } else {
    // Для infinite scroll сбрасываем и загружаем с первой страницы
    allGames.value = []
    gamesStore.page = 1
    gamesStore.total = 0 // Сбрасываем total чтобы загрузить заново
    // Загружаем первую страницу
    await loadMoreGames()
  }
}

const totalPages = computed(() => 
  Math.ceil(gamesStore.total / gamesStore.pageSize)
)

const goToPage = (page: number) => {
  // При переходе на другую страницу фильтры не меняются, только страница
  filtersChanged.value = false
  gamesStore.page = page
  
  // Обновляем URL
  router.push({
    query: {
      ...route.query,
      mode: 'pagination',
      page
    }
  })
  
  applyFilters()
  if (process.client) {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

// Загрузка следующей страницы для infinite scroll
const loadMoreGames = async () => {
  // Проверяем, не загружаем ли мы уже
  if (gamesStore.loading) {
    return
  }
  
  // Если total уже установлен и мы достигли конца, не загружаем
  if (gamesStore.total > 0 && allGames.value.length >= gamesStore.total) {
    return
  }
  
  gamesStore.loading = true
  gamesStore.error = null
  
  try {
    const query: Record<string, any> = {
      page: gamesStore.page,
      pageSize: gamesStore.pageSize,
    }
    
    if (gamesStore.search) query.search = gamesStore.search
    if (gamesStore.sort) query.sort = gamesStore.sort
    if (gamesStore.platforms) query.platforms = gamesStore.platforms
    if (gamesStore.genres) query.genres = gamesStore.genres
    if (gamesStore.publishers) query.publishers = gamesStore.publishers
    if (gamesStore.developers) query.developers = gamesStore.developers
    if (gamesStore.stores) query.stores = gamesStore.stores
    if (gamesStore.tags) query.tags = gamesStore.tags
    if (gamesStore.dates) query.dates = gamesStore.dates
    if (gamesStore.metacritic) query.metacritic = gamesStore.metacritic
    if (gamesStore.ratingMin || gamesStore.ratingMax) {
      const min = gamesStore.ratingMin || '0'
      const max = gamesStore.ratingMax || '5'
      query.rating = `${min},${max}`
    }
    
    const { data, error } = await useFetch('/api/games', { query })
    
    if (error.value) {
      gamesStore.error = error.value.message
      return
    }
    
    if (data.value) {
      const response = data.value as { results: any[]; total: number }
      allGames.value = [...allGames.value, ...response.results]
      gamesStore.total = response.total
      gamesStore.page++
    }
  } catch (e: any) {
    gamesStore.error = e.message
  } finally {
    gamesStore.loading = false
  }
}

// Infinite scroll обработчик
let scrollTimeout: NodeJS.Timeout | null = null

const handleScroll = () => {
  if (!process.client) return
  if (viewMode.value !== 'infinite' || gamesStore.loading) return
  
  if (scrollTimeout) clearTimeout(scrollTimeout)
  
  scrollTimeout = setTimeout(() => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop
    const windowHeight = window.innerHeight
    const documentHeight = document.documentElement.scrollHeight
    
    // Загружаем следующую страницу когда пользователь близко к концу (200px)
    if (scrollTop + windowHeight >= documentHeight - 200) {
      saveScrollPosition()
      loadMoreGames()
    }
  }, 100)
}

// Сохранение позиции скролла
const saveScrollPosition = () => {
  if (!process.client) return
  if (viewMode.value === 'infinite') {
    sessionStorage.setItem('catalog_scroll_position', String(window.scrollY))
    sessionStorage.setItem('catalog_games_count', String(allGames.value.length))
  }
}

// Восстановление позиции скролла
const restoreScrollPosition = () => {
  if (!process.client) return
  if (viewMode.value === 'infinite') {
    const savedPosition = sessionStorage.getItem('catalog_scroll_position')
    const savedCount = sessionStorage.getItem('catalog_games_count')
    
    if (savedPosition && savedCount) {
      nextTick(() => {
        window.scrollTo(0, Number(savedPosition))
        sessionStorage.removeItem('catalog_scroll_position')
        sessionStorage.removeItem('catalog_games_count')
      })
    }
  }
}

// Наблюдаем за изменением режима
watch(() => viewMode.value, (newMode, oldMode) => {
  if (!process.client) return
  if (!hasLoadedInitialData.value) return // Пропускаем до инициализации в onMounted
  
  if (newMode === 'infinite') {
    // Удаляем старый обработчик если был
    if (oldMode === 'pagination') {
      window.removeEventListener('scroll', handleScroll)
    }
    window.addEventListener('scroll', handleScroll)
    // Загружаем первую страницу если список пуст
    if (allGames.value.length === 0 && !gamesStore.loading) {
      loadMoreGames()
    }
  } else {
    window.removeEventListener('scroll', handleScroll)
  }
})

// При обновлении страницы или изменении query - гарантированно применяем фильтры
watch(() => route.fullPath, async () => {
  if (!process.client) return
  if (!hasLoadedInitialData.value) return // Пропускаем при первой загрузке, это обрабатывается в onMounted

  // Обновляем фильтры из query параметров при изменении URL
  if (route.query.genres) {
    const genreIds = String(route.query.genres).split(',').map(Number).filter(n => !isNaN(n))
    selectedGenres.value = genreIds
    gamesStore.genres = genreIds.join(',')
  } else {
    selectedGenres.value = []
    gamesStore.genres = ''
  }

  // Если режим infinite — сбрасываем накопленные игры и начинаем с первой страницы
  if (viewMode.value === 'infinite') {
    allGames.value = []
    gamesStore.page = 1
  }

  // Помечаем что фильтры изменились
  filtersChanged.value = true

  // Применяем фильтры
  try {
    await applyFilters()
  } catch (e) {
    console.error('Error applying filters on route change:', e)
  }
})

// Обработка возврата назад через браузер (когда страница становится активной)
if (process.client) {
  // Используем событие visibilitychange для определения возврата на страницу
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && hasLoadedInitialData.value) {
      // Страница стала видимой и была инициализирована
      // Если данных нет, загружаем их
      if (allGames.value.length === 0 && gamesStore.games.length === 0 && !gamesStore.loading) {
        applyFilters()
      }
    }
  })
  
  // Также обрабатываем событие pageshow для возврата через кнопку "Назад"
  window.addEventListener('pageshow', (event) => {
    if (event.persisted || (performance.navigation && performance.navigation.type === 2)) {
      // Страница загружена из кеша (возврат назад)
      if (hasLoadedInitialData.value && allGames.value.length === 0 && gamesStore.games.length === 0 && !gamesStore.loading) {
        applyFilters()
      }
    }
  })
}

// Наблюдаем за изменением игр в store для пагинации
watch(() => gamesStore.games, () => {
  if (viewMode.value === 'pagination') {
    // Сохраняем состояние для восстановления при возврате
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('catalog_page', String(gamesStore.page))
    }
  }
  // НЕ пересчитываем общее количество при пагинации - оно должно меняться только при изменении фильтров
})


// Восстанавливаем выбранные фильтры из store
watch(() => gamesStore.platforms, (value) => {
  if (value) {
    selectedPlatforms.value = value.split(',').map(Number).filter(n => !isNaN(n))
  }
}, { immediate: true })

watch(() => gamesStore.genres, (value) => {
  if (value) {
    selectedGenres.value = value.split(',').map(Number).filter(n => !isNaN(n))
  }
}, { immediate: true })

const clearAllFilters = () => {
  filtersChanged.value = true
  gamesStore.resetFilters()
  selectedPlatforms.value = []
  selectedGenres.value = []
  selectedPublishers.value = []
  selectedDevelopers.value = []
  selectedStores.value = []
  selectedTags.value = []
  dateFrom.value = null
  dateTo.value = null
  ratingMin.value = ''
  ratingMax.value = ''
  allGames.value = []
  gamesStore.total = 0 // Сбрасываем total чтобы загрузить заново
  gamesStore.page = 1 // Убеждаемся что страница = 1
  // Очищаем URL параметры
  if (process.client) {
    router.push({ query: { mode: viewMode.value } })
  }
  applyFilters()
}

// Дополнительные watchers для всех фильтров
watch(() => gamesStore.publishers, (value) => {
  if (value) {
    selectedPublishers.value = value.split(',').map(Number).filter(n => !isNaN(n))
  } else {
    selectedPublishers.value = []
  }
}, { immediate: true })

watch(() => gamesStore.developers, (value) => {
  if (value) {
    selectedDevelopers.value = value.split(',').map(Number).filter(n => !isNaN(n))
  } else {
    selectedDevelopers.value = []
  }
}, { immediate: true })

watch(() => gamesStore.stores, (value) => {
  if (value) {
    selectedStores.value = value.split(',').map(Number).filter(n => !isNaN(n))
  } else {
    selectedStores.value = []
  }
}, { immediate: true })

watch(() => gamesStore.tags, (value) => {
  if (value) {
    selectedTags.value = value.split(',').map(Number).filter(n => !isNaN(n))
  } else {
    selectedTags.value = []
  }
}, { immediate: true })

watch(() => gamesStore.ratingMin, (value) => {
  ratingMin.value = value || ''
}, { immediate: true })

watch(() => gamesStore.ratingMax, (value) => {
  ratingMax.value = value || ''
}, { immediate: true })

watch(() => gamesStore.dates, (value) => {
  if (value) {
    const [from, to] = value.split(',')
    if (from) {
      const fromYear = new Date(from).getFullYear()
      if (!isNaN(fromYear)) dateFrom.value = fromYear
    }
    if (to) {
      const toYear = new Date(to).getFullYear()
      if (!isNaN(toYear)) dateTo.value = toYear
    }
  } else {
    dateFrom.value = null
    dateTo.value = null
  }
}, { immediate: true })

watch(() => gamesStore.page, (newPage, oldPage) => {
  if (!hasLoadedInitialData.value) return
  if (newPage === oldPage) return
  
  // При изменении страницы применяем фильтры (но не помечаем как изменение фильтров)
  if (viewMode.value === 'pagination') {
    filtersChanged.value = false
    applyFilters()
  }
}, { immediate: false })

watch(() => gamesStore.total, (newTotal, oldTotal) => {
  if (newTotal !== oldTotal && hasLoadedInitialData.value) {
    // Обновляем информацию о количестве игр
  }
})

watch(() => gamesStore.loading, (isLoading) => {
  if (!isLoading && hasLoadedInitialData.value) {
    // Загрузка завершена, можно выполнить дополнительные действия
  }
})

watch(() => gamesStore.error, (error) => {
  if (error && hasLoadedInitialData.value) {
    console.error('Ошибка загрузки игр:', error)
  }
})

// Наблюдаем за изменением выбранных фильтров и синхронизируем с store (только после инициализации)
watch(() => selectedPlatforms.value, (value) => {
  if (!hasLoadedInitialData.value) return
  gamesStore.platforms = value.length > 0 ? value.join(',') : ''
}, { deep: true })

watch(() => selectedGenres.value, (value) => {
  if (!hasLoadedInitialData.value) return
  gamesStore.genres = value.length > 0 ? value.join(',') : ''
}, { deep: true })

watch(() => selectedPublishers.value, (value) => {
  if (!hasLoadedInitialData.value) return
  gamesStore.publishers = value.length > 0 ? value.join(',') : ''
}, { deep: true })

watch(() => selectedDevelopers.value, (value) => {
  if (!hasLoadedInitialData.value) return
  gamesStore.developers = value.length > 0 ? value.join(',') : ''
}, { deep: true })

watch(() => selectedStores.value, (value) => {
  if (!hasLoadedInitialData.value) return
  gamesStore.stores = value.length > 0 ? value.join(',') : ''
}, { deep: true })

watch(() => selectedTags.value, (value) => {
  if (!hasLoadedInitialData.value) return
  gamesStore.tags = value.length > 0 ? value.join(',') : ''
}, { deep: true })

watch(() => ratingMin.value, (value) => {
  if (!hasLoadedInitialData.value) return
  gamesStore.ratingMin = value || ''
})

watch(() => ratingMax.value, (value) => {
  if (!hasLoadedInitialData.value) return
  gamesStore.ratingMax = value || ''
})

watch(() => dateFrom.value, (value) => {
  if (!hasLoadedInitialData.value) return
  updateDates()
})

watch(() => dateTo.value, (value) => {
  if (!hasLoadedInitialData.value) return
  updateDates()
})

onUnmounted(() => {
  if (process.client) {
  window.removeEventListener('scroll', handleScroll)
  }
  if (scrollTimeout) clearTimeout(scrollTimeout)
  if (searchTimeout) clearTimeout(searchTimeout)
})
</script>

<style scoped lang="scss">
.catalog-page {
  padding: 24px 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.page-title {
  font-size: 32px;
  margin: 0;
  font-weight: 600;
}

.mode-switcher {
  display: flex;
  align-items: center;
  gap: 12px;
}

.mode-label {
  font-size: 14px;
  font-weight: 500;
  color: #666;
}

.mode-buttons {
  display: flex;
  gap: 8px;
  background: #f5f5f5;
  padding: 4px;
  border-radius: 8px;
}

.mode-btn {
  padding: 8px 16px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #666;
  transition: all 0.2s;
}

.mode-btn:hover {
  background: rgba(0, 0, 0, 0.05);
}

.mode-btn.active {
  background: white;
  color: #1976d2;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.catalog-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 24px;
  max-width: 1440px;
  margin: 0 auto;
  padding: 0;
}

.filters-sidebar {
  background: #e0e0e0;
  padding: 20px;
  border-radius: 8px;
  height: fit-content;
  position: sticky;
  top: 24px;
  max-height: calc(100vh - 48px);
  overflow-y: auto;
}

.filters-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid #ddd;
}

.filters-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.clear-filters {
  background: transparent;
  border: 1px solid #d32f2f;
  color: #d32f2f;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.clear-filters:hover {
  background: rgba(211, 47, 47, 0.1);
}

.filter-group {
  margin-bottom: 24px;
}

.filter-label {
  display: block;
  font-weight: 600;
  margin-bottom: 8px;
  font-size: 14px;
  color: #333;
}

.search-input,
.filter-select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  box-sizing: border-box;
}

.search-input:focus,
.filter-select:focus {
  outline: none;
  border-color: #1976d2;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  padding: 4px 0;
}

.checkbox-label input[type="checkbox"] {
  cursor: pointer;
}

.date-range {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rating-range {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rating-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.rating-separator {
  color: #666;
  font-weight: 500;
}

.date-input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.date-separator {
  color: #666;
}

.catalog-content {
  min-height: 400px;
}

.results-info {
  margin-bottom: 16px;
  color: #666;
  font-size: 14px;
}

.error-message {
  background: #ffebee;
  color: #c62828;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 16px;
}

.games-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 32px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 32px;
}

.pagination-btn {
  padding: 10px 20px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background: #f5f5f5;
  border-color: #1976d2;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-info {
  color: #666;
  font-size: 14px;
}

.infinite-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  gap: 16px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #1976d2;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.infinite-end {
  text-align: center;
  padding: 20px;
  color: #666;
  font-size: 14px;
}

@media (max-width: 960px) {
  .catalog-layout {
    grid-template-columns: 1fr;
  }

  .filters-sidebar {
    position: static;
    max-height: none;
  }

  .games-grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 768px) {
  .catalog-page {
    padding: 16px;
  }

  .page-title {
    font-size: 24px;
  }

  .games-grid {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 16px;
  }

  .filters-sidebar {
    padding: 16px;
  }

  .filter-group {
    margin-bottom: 16px;
  }

  .filter-group-title {
    font-size: 14px;
  }

  .mode-switcher {
    margin-top: 16px;
  }

  .mode-label {
    font-size: 13px;
  }

  .mode-btn {
    font-size: 13px;
    padding: 6px 12px;
  }
}

@media (max-width: 480px) {
  .catalog-page {
    padding: 12px;
  }

  .page-title {
    font-size: 20px;
  }

  .games-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 12px;
  }

  .filters-sidebar {
    padding: 12px;
  }

  .filter-group {
    margin-bottom: 12px;
  }

  .filter-group-title {
    font-size: 13px;
  }

  .mode-switcher {
    margin-top: 12px;
    flex-direction: column;
    gap: 8px;
  }

  .mode-buttons {
    width: 100%;
  }

  .mode-btn {
    flex: 1;
    font-size: 12px;
    padding: 6px 10px;
  }

  .pagination {
    flex-direction: column;
    gap: 12px;
  }

  .pagination-btn {
    width: 100%;
  }
}

@media (max-width: 375px) {
  .catalog-page {
    padding: 10px;
  }

  .page-title {
    font-size: 18px;
  }

  .games-grid {
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .filters-sidebar {
    padding: 10px;
  }

  .filter-group-title {
    font-size: 12px;
  }

  .mode-btn {
    font-size: 11px;
    padding: 5px 8px;
  }

  .pagination-info {
    font-size: 12px;
  }
}
</style>
