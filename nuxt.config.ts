// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  runtimeConfig: {
    rawgApiKey: process.env.RAWG_API_KEY,
    rawgBaseUrl: process.env.RAWG_BASE_URL,
    public: {}
  },
  components: true,
  devtools: { enabled: true },
  modules: ['@pinia/nuxt'],
  compatibilityDate: '2024-01-01',
  typescript: {
    strict: true,
    typeCheck: false
  },
  css: [
    '@/assets/styles/main.scss'
  ],
  nitro: {
    experimental: {
      wasm: true
    }
  }
})

