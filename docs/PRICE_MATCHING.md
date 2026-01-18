# Система сопоставления цен игр (RAWG ↔ CheapShark)

## Архитектура

Система состоит из трех компонентов:

1. **gameMatching.ts** - Реализация трех стратегий сопоставления
2. **priceEnrichment.ts** - Интеграция с CheapShark API и обогащение данных
3. **matchEvaluation.ts** - Система оценки качества сопоставления

## Стратегии сопоставления

### Стратегия A: Точная (Exact)

**Принцип:** Нормализация названия и точное совпадение

**Нормализация:**
- Приведение к нижнему регистру
- Удаление знаков препинания
- Удаление слов-шума (goty, deluxe, definitive, complete, edition, remastered, bundle...)

**Плюсы:**
- Быстро и просто
- Высокая точность для простых названий

**Минусы:**
- Часто промахивается на играх с разными изданиями
- Не учитывает опечатки и вариации написания

### Стратегия B: Нечёткая (Fuzzy)

**Принцип:** Сравнение "похожести" строк

**Методы:**
- Расстояние Левенштейна (нормализованное)
- Схожесть по токенам (Jaccard similarity)
- Комбинированный score (взвешенное среднее: 60% Levenshtein + 40% Token)

**Порог:** 0.60 (по умолчанию)

**Плюсы:**
- Ловит вариации названий (GOTY/Deluxe)
- Устойчива к опечаткам

**Минусы:**
- Больше ложных совпадений
- Может сопоставить разные игры с похожими названиями

### Стратегия C: Гибридная (Hybrid) - Рекомендуется

**Принцип:** Fuzzy + штрафы/бонусы по дополнительным признакам

**Компоненты:**
1. Базовый fuzzy score (порог: 0.55)
2. Бонус/штраф по году релиза:
   - Совпадение года: +0.1
   - Разница 1 год: +0.05
   - Разница > 3 лет: -0.2
3. Штраф за отсутствие PC платформы: -0.15

**Плюсы:**
- Лучший баланс точности и полноты
- Учитывает контекст (год, платформа)

**Минусы:**
- Сложнее в реализации
- Требует больше данных

## Использование

### В API endpoints

```typescript
import { enrichGamesWithPrices } from '../utils/priceEnrichment'

// Обогащение списка игр
const priceMap = await enrichGamesWithPrices(
    games.map(g => ({
        id: g.id,
        name: g.name,
        released: g.released,
        platforms: g.platforms
    })),
    'hybrid' // или 'exact', 'fuzzy'
)
```

### Выбор стратегии

Стратегия передается через параметр `priceStrategy` в запросе:

```
GET /api/games?priceStrategy=hybrid
```

Доступные значения:
- `exact` - Точное сопоставление
- `fuzzy` - Нечёткое сопоставление
- `hybrid` - Гибридное сопоставление (по умолчанию)

## Оценка качества

### Метрики

- **Precision (Точность)** = TP / (TP + FP)
  - Доля найденных совпадений, которые действительно правильные
  
- **Recall (Полнота)** = TP / (TP + FN)
  - Доля правильных совпадений, которые были найдены
  
- **F1 Score** = 2 * (Precision * Recall) / (Precision + Recall)
  - Гармоническое среднее точности и полноты

Где:
- **TP (True Positives)** - Нашли и это реально правильная игра
- **FP (False Positives)** - Нашли, но не та игра
- **FN (False Negatives)** - Не нашли, хотя соответствие есть

### Тестирование на датасете

**Эндпоинт:** `POST /api/games/match-test`

**Формат запроса:**
```json
{
  "dataset": [
    {
      "rawgTitle": "Tomb Raider: Anniversary",
      "rawgReleased": "2007-03-01",
      "rawgPlatforms": ["PC", "PlayStation 2"],
      "expectedCheapSharkGameId": "456",
      "expectedCheapSharkTitle": "Tomb Raider: Anniversary"
    },
    {
      "rawgTitle": "The Witcher 3: Wild Hunt",
      "rawgReleased": "2015-05-19",
      "rawgPlatforms": ["PC", "PlayStation 4"],
      "expectedCheapSharkGameId": "123",
      "expectedCheapSharkTitle": "The Witcher 3: Wild Hunt"
    }
  ]
}
```

**Формат ответа:**
```json
{
  "evaluations": {
    "exact": {
      "strategy": "exact",
      "truePositives": 45,
      "falsePositives": 5,
      "falseNegatives": 10,
      "precision": 0.90,
      "recall": 0.82,
      "f1": 0.86,
      "totalGames": 100,
      "matchedGames": 50,
      "unmatchedGames": 50
    },
    "fuzzy": { ... },
    "hybrid": { ... }
  },
  "comparison": {
    "bestF1": { "strategy": "hybrid", "value": 0.92 },
    "bestPrecision": { "strategy": "exact", "value": 0.90 },
    "bestRecall": { "strategy": "hybrid", "value": 0.88 },
    "summary": [
      { "strategy": "exact", "precision": 0.90, "recall": 0.82, "f1": 0.86 },
      { "strategy": "fuzzy", "precision": 0.85, "recall": 0.90, "f1": 0.87 },
      { "strategy": "hybrid", "precision": 0.88, "recall": 0.88, "f1": 0.92 }
    ]
  }
}
```

## Создание тестового датасета

Рекомендуемый состав датасета (100 игр):
- 60 "простых" игр (стандартные названия без издания)
- 40 "проблемных" игр:
  - С разными изданиями (GOTY, Deluxe, Ultimate)
  - С символами и спецзнаками
  - С разным написанием
  - Консольные игры (без PC версии)

Для каждой игры нужно вручную определить:
- Есть ли соответствие в CheapShark
- Если есть - какой `gameID` и `title` в CheapShark

## Настройка

### Включение/отключение CheapShark

По умолчанию CheapShark включен. Для отключения установите переменную окружения:

```bash
DISABLE_CHEAPSHARK=1
```

### Rate Limiting

Система автоматически обрабатывает rate limiting:
- При получении 429 ошибки - экспоненциальная задержка (1s, 2s, 3s)
- При Retry-After > 30 секунд - блокировка API на 1 час
- Кэширование результатов на 24 часа

### Параллельная обработка

При обогащении списка игр:
- Максимум 2 одновременных запроса
- Задержка 1-1.5 секунды между батчами

## Логирование

Все операции логируются с префиксом `[CheapShark]`:
- Поиск совпадений
- Найденные цены
- Ошибки и rate limiting
- Использование кэша
