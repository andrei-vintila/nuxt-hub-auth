// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    'nuxt-auth-utils',
    '@nuxthub/core'
  ],
  hub: {
    database: true
  },
  devtools: { enabled: true }
})