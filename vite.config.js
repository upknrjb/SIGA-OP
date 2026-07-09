import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import laravel from 'laravel-vite-plugin';
import path from 'path';

const isStatic = process.env.NETLIFY === 'true' || process.env.STATIC_BUILD === 'true';

export default defineConfig({
    plugins: [
        !isStatic && laravel({
            input: ['resources/js/app.jsx'],
            refresh: true,
        }),
        react(),
        tailwindcss(),
    ].filter(Boolean),
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './resources/js'),
        },
    },
    build: isStatic ? {
        outDir: 'dist',
        rollupOptions: {
            input: 'index.html',
        },
    } : undefined,
});
