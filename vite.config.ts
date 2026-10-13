import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  build: {
    rolldownOptions: {
      output: {
        strictExecutionOrder: true,
        codeSplitting: {
          groups: [
            {
              name: 'react-vendor',
              test: /node_modules[\\/](?:react|react-dom|scheduler)[\\/]/,
              priority: 30,
            },
            {
              name: 'editor-core',
              test: /node_modules[\\/](?:@tiptap[\\/](?:core|react)|prosemirror-(?:model|state|view|transform))[\\/]/,
              priority: 27,
            },
            { name: 'editor-extensions', test: /node_modules[\\/]@tiptap[\\/]/, priority: 26 },
            { name: 'editor-tools', test: /node_modules[\\/]prosemirror-/, priority: 25 },
            {
              name: 'radix-vendor',
              test: /node_modules[\\/](?:@radix-ui|radix-ui)[\\/]/,
              priority: 20,
            },
            { name: 'data-vendor', test: /node_modules[\\/]@tanstack[\\/]/, priority: 15 },
          ],
        },
      },
    },
  },
})
