import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// GitHub Pages 部署配置
export default defineConfig({
  plugins: [vue()],
  base: '/sql-cheatsheet/',
}) 