# Gameshop

A Nuxt 3 project with Vue 3, Pinia Store, and TypeScript.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables:

Create a `.env` file in the root directory with the following variables:

```env
RAWG_API_KEY=your_rawg_api_key_here
RAWG_BASE_URL=https://api.rawg.io/api
```

**Important:** You need to get a RAWG API key from https://rawg.io/apidocs. Without these environment variables, the application will not work properly.

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

