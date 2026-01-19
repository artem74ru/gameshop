# Gameshop

A Nuxt 3 project with Vue 3, Pinia Store, and TypeScript.

## 🚀 Быстрый старт

**Для подробной инструкции по установке и развертыванию см. [INSTALLATION.md](./INSTALLATION.md)**

### Краткая инструкция:

1. **Установите зависимости:**
```bash
npm install
```

2. **Создайте файл `.env` в корне проекта:**
```env
RAWG_API_KEY=your_rawg_api_key_here
RAWG_BASE_URL=https://api.rawg.io/api
```

**Важно:** Получите RAWG API ключ на https://rawg.io/apidocs

3. **Запустите проект:**
```bash
npm run dev
```

Откройте http://localhost:3000 в браузере.

## 📖 Документация

- **[INSTALLATION.md](./INSTALLATION.md)** - Подробная инструкция по установке и развертыванию
- **[docs/VERCEL_DEPLOYMENT.md](./docs/VERCEL_DEPLOYMENT.md)** - Развертывание на Vercel
- **[docs/VERCEL_ENV_VARIABLES.md](./docs/VERCEL_ENV_VARIABLES.md)** - Настройка переменных окружения

## Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Build

Build the application for production:

```bash
npm run build
```

## Preview

Preview the production build:

```bash
npm run preview
```

## Tech Stack

- **Nuxt 3** - The Vue.js Framework
- **Vue 3** - Progressive JavaScript Framework
- **Pinia** - State management for Vue
- **TypeScript** - Typed JavaScript at any scale

## Project Structure

```
.
├── pages/          # Application pages
├── stores/         # Pinia stores
├── components/     # Vue components (auto-imported)
├── app.vue         # Root component
├── nuxt.config.ts  # Nuxt configuration
└── tsconfig.json   # TypeScript configuration
```

