import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { siteConfig } from './src/data/siteConfig.js'

const replaceToken = (html, token, value) =>
  html.replaceAll(`__${token}__`, value)

export default defineConfig(() => ({
  base: './',

  plugins: [
    react(),
    {
      name: 'aurelia-config-meta',
      transformIndexHtml(html) {
        const ogImage = siteConfig.seo.ogImage || siteConfig.images.hero.src

        return [
          ['THEME_COLOR', siteConfig.theme.espressoBrown],
          ['META_DESCRIPTION', siteConfig.seo.description],
          ['OG_TITLE', siteConfig.seo.ogTitle],
          ['OG_DESCRIPTION', siteConfig.seo.ogDescription],
          ['OG_IMAGE', ogImage],
          ['SITE_TITLE', siteConfig.seo.title],
          ['ROBOTS_META', siteConfig.demoMode ? 'noindex,nofollow' : 'index,follow'],
        ].reduce(
          (result, [token, value]) => replaceToken(result, token, value),
          html
        )
      },
    },
  ],

  server: {
    host: '0.0.0.0',
    port: 3000,
  },

  build: {
    target: 'es2020',
    sourcemap: true,
  },
}))
