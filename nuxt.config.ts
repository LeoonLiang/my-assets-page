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
    devtools: { enabled: true },
    app: {
        head: {
            htmlAttrs: {
                lang: 'zh-CN'
            },
            title: '我的资产页面',
            titleTemplate: '%s - 我的资产页面',
            link: [
                { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
                { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
                { rel: 'shortcut icon', href: '/favicon.ico' },
                { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
                { rel: 'manifest', href: '/site.webmanifest' },
                { rel: 'canonical', href: '/' }
            ],
            meta: [
                { name: 'theme-color', content: '#ffffff' },
                { name: 'description', content: '个人资产总览与管理页面，包含资产状态、日均成本与统计概览。' },
                { name: 'keywords', content: '资产, 资产管理, 个人资产, 财务, 数码, 仪表盘' },
                { name: 'robots', content: 'index,follow' },
                { property: 'og:type', content: 'website' },
                { property: 'og:title', content: '我的资产页面' },
                { property: 'og:description', content: '个人资产总览与管理页面，包含资产状态、日均成本与统计概览。' },
                { property: 'og:url', content: '/' },
                { property: 'og:image', content: '/android-chrome-512x512.png' },
                { name: 'twitter:card', content: 'summary_large_image' },
                { name: 'twitter:title', content: '我的资产页面' },
                { name: 'twitter:description', content: '个人资产总览与管理页面，包含资产状态、日均成本与统计概览。' },
                { name: 'twitter:image', content: '/android-chrome-512x512.png' }
            ]
        }
    }
})
