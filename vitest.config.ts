import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config'
import baseViteConfig from './vite.config'

const resolvedViteConfig =
  typeof baseViteConfig === 'function'
    ? baseViteConfig({ mode: 'test', command: 'build' } as any)
    : baseViteConfig

export default mergeConfig(
  resolvedViteConfig as any,
  defineConfig({
    test: {
      environment: 'jsdom',
      exclude: [...configDefaults.exclude, 'e2e/**'],
      root: fileURLToPath(new URL('./', import.meta.url)),
    },
  }),
)
