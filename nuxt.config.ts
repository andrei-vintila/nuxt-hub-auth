import { createResolver } from "@nuxt/kit";
const { resolve } = createResolver(import.meta.url);


// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    'nuxt-auth-utils',
    '@nuxthub/core'
  ],
  alias: { "#auth-layer": resolve("./") },
  hub: {
    database: true
  },
  devtools: { enabled: true }
})
