<template>
  <div class="publisher-wrapper">
    <NuxtLink
        v-for="p in publishers"
        :key="p.id"
        :to="`/catalog?publishers=${p.id}`"
        class="publisher-btn"
        :title="p.name"
    >
      {{ getShortName(p.name) }}
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
interface Publisher {
  id: number
  name: string
  slug: string
  gamesCount?: number
}

const props = defineProps<{
  publishers: Publisher[]
}>()

// Функция для сокращения названий издателей
const getShortName = (name: string): string => {
  // Известные сокращения
  const abbreviations: Record<string, string> = {
    'electronic arts': 'EA',
    'ubisoft entertainment': 'Ubisoft',
    'activision': 'Activision',
    'take-two interactive': 'Take-Two',
    'warner bros. interactive entertainment': 'WB Games',
    'warner bros interactive entertainment': 'WB Games',
    'square enix': 'Square Enix',
    'bandai namco entertainment': 'Bandai Namco',
    'bandai namco': 'Bandai Namco',
    'sega': 'SEGA',
    'capcom': 'Capcom',
    'konami': 'Konami',
    'nintendo': 'Nintendo',
    'sony interactive entertainment': 'Sony',
    'microsoft': 'Microsoft',
    'valve': 'Valve',
    'epic games': 'Epic Games',
    'cd projekt': 'CD Projekt',
    'cd projekt red': 'CD Projekt',
    'paradox interactive': 'Paradox',
    'focus home interactive': 'Focus Home',
    'thq nordic': 'THQ Nordic',
    'deep silver': 'Deep Silver',
    '2k games': '2K Games',
    'rockstar games': 'Rockstar',
    'bethesda softworks': 'Bethesda',
    'zenimax media': 'Zenimax',
    '505 games': '505 Games',
    'tinybuild': 'TinyBuild',
    'devolver digital': 'Devolver',
    'annapurna interactive': 'Annapurna',
    'private division': 'Private Division',
    'xbox game studios': 'Xbox',
    'playstation studios': 'PlayStation',
    'nintendo of america': 'Nintendo',
    'nintendo of europe': 'Nintendo'
  }
  
  const lowerName = name.toLowerCase().trim()
  
  // Проверяем точное совпадение
  if (abbreviations[lowerName]) {
    return abbreviations[lowerName]
  }
  
  // Проверяем частичное совпадение
  for (const [key, value] of Object.entries(abbreviations)) {
    if (lowerName.includes(key)) {
      return value
    }
  }
  
  // Если название короткое (до 12 символов), возвращаем как есть
  if (name.length <= 12) {
    return name
  }
  
  // Берем первые слова до 12 символов
  const words = name.split(' ')
  let shortName = ''
  
  for (const word of words) {
    if ((shortName + ' ' + word).length <= 12) {
      shortName = shortName ? shortName + ' ' + word : word
    } else {
      break
    }
  }
  
  return shortName || name.substring(0, 12) + '...'
}
</script>

<style scoped>
.publisher-wrapper {
  display: flex;
  justify-content: flex-start;
  gap: 12px;
  flex-wrap: wrap;
}

.publisher-btn {
  min-width: auto;
  height: 40px;
  padding: 0 16px;
  border-radius: 20px;
  background: #f0f0f0;
  border: 1px solid #e0e0e0;
  font-size: 13px;
  font-weight: 500;
  text-decoration: none;
  color: #333;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.publisher-btn:hover {
  background: #e0e0e0;
  border-color: #1976d2;
  color: #1976d2;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

@media (max-width: 640px) {
  .publisher-wrapper {
    gap: 8px;
  }
  
  .publisher-btn {
    height: 36px;
    padding: 0 12px;
    font-size: 12px;
  }
}
</style>
