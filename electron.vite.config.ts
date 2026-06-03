import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'
import react from '@vitejs/plugin-react'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import { resolve } from 'path'

export default defineConfig({
  main: {
    resolve: {
      alias: {
        '@shared': resolve('src/shared'),
        '@main': resolve('src/main'),
        '@cli': resolve('src/cli'),
      },
    },
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: {
          index: resolve('src/main/index.ts'),
          'cli/index': resolve('src/cli/index.ts'),
        },
        output: {
          banner: (chunk) => (chunk.name === 'cli/index' ? '#!/usr/bin/env node' : ''),
        },
      },
    },
  },
  preload: {
    resolve: {
      alias: { '@shared': resolve('src/shared') },
    },
    plugins: [externalizeDepsPlugin()],
  },
  renderer: {
    publicDir: resolve('resources'),
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        '@shared': resolve('src/shared'),
      },
    },
    plugins: [react(), vanillaExtractPlugin()],
    build: {
      rollupOptions: {
        input: {
          index: resolve('src/renderer/index.html'),
        },
      },
    },
  },
})
