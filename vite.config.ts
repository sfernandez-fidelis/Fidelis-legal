import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: './src/test/setup.ts',
      css: true,
      include: ['src/**/*.test.{ts,tsx}'],
      exclude: ['tests/e2e/**'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html'],
        include: [
          'src/features/auth/api/authService.ts',
          'src/features/contacts/contactUtils.ts',
          'src/features/contacts/api/contactService.ts',
          'src/features/documents/api/documentService.ts',
          'src/features/templates/api/templateService.ts',
          'src/utils/templateEngine.ts',
          'src/utils/word/wordGenerator.ts',
        ],
        exclude: ['src/**/*.d.ts', 'src/main.tsx'],
        thresholds: {
          lines: 45,
          functions: 50,
          branches: 30,
          statements: 45,
        },
      },
    },
    build: {
      sourcemap: true,
      chunkSizeWarningLimit: 900,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom', '@tanstack/react-query'],
            editors: ['@tiptap/react', '@tiptap/starter-kit'],
            generators: ['docx', 'jspdf', 'jspdf-autotable', 'html2pdf.js'],
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
