// / <reference types="vite/client" />

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/mnist-comparison-system/', // <--- 注意：这里填您在 GitHub 上的仓库名称，前后必须都有斜杠，例如 '/mnistcnn/'
})