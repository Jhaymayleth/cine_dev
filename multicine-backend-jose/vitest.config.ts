import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Los tests unitarios no deben tocar la base de datos: solo esquemas y
    // utilidades puras. El flujo completo vive en tests/e2e.
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
    restoreMocks: true,
  },
})
