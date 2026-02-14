import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
  base: './',
  css: {
    transformer: 'lightningcss',
    lightningcss: {
      targets: {
        chrome: 30 << 16,
        firefox: 30 << 16,
        safari: 6 << 16,
        edge: 12 << 16
      }
    }
  },
  build: {
    outDir: 'docs',
    cssMinify: 'lightningcss'
  },
  esbuild: {
    drop: ['console', 'debugger'],
    legalComments: 'none'
  },
  plugins: [
    vue({
      template: {
        compilerOptions: {
          comments: false
        }
      }
    }),
    tailwindcss()
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})
