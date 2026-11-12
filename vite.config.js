import { defineConfig } from "vite";
import laravel from "laravel-vite-plugin";
import react from "@vitejs/plugin-react";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
    plugins: [
        laravel({
            input: [
                "resources/css/app.css",
                "resources/js/main.tsx",
            ],
            refresh: true,
        }),

        tanstackRouter({
            target: "react",
            routesDirectory: "resources/js/routes",
            generatedRouteTree: "resources/js/routeTree.gen.ts",
            autoCodeSplitting: true,
        }),

        react(),
        tailwindcss(),
    ],

    server: {
        host: "0.0.0.0",
        port: 5173,

        hmr: {
            host: "localhost",
            port: 5173,
        },

        watch: {
            usePolling: true,
            interval: 300,
        },
    },
});
