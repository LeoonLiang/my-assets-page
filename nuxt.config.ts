// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    ssr: true,

    nitro: {
        preset: 'github-pages'
    },

    routeRules: {
        '/': { prerender: true }
    },

    compatibilityDate: '2024-11-01',
    devtools: { enabled: true }
})
