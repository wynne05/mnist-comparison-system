// import path from "path";
// import { fileURLToPath } from "url";
// import tailwindcss from "@tailwindcss/vite";
// import react from "@vitejs/plugin-react";
// import { defineConfig } from "vite";
// import { viteSingleFile } from "vite-plugin-singlefile";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [react(), tailwindcss(), viteSingleFile()],
//   resolve: {
//     alias: {
//       "@": path.resolve(__dirname, "src"),
//     },
//   },
// });


import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/mnist-comparison-system/', // <--- 注意：这里填您在 GitHub 上的仓库名称，前后必须都有斜杠，例如 '/mnistcnn/'
})