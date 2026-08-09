import { defineConfig } from "vite";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: "./",
  resolve: {
    alias: {
      "@core": resolve(__dirname, "src/core/"),
      "@scenes": resolve(__dirname, "src/scenes/"),
      "@entities": resolve(__dirname, "src/entities/"),
      "@components": resolve(__dirname, "src/components/"),
      "@systems": resolve(__dirname, "src/systems/"),
      "@ui": resolve(__dirname, "src/ui/"),
      "@effects": resolve(__dirname, "src/effects/"),
      "@data": resolve(__dirname, "src/data/"),
      "@utils": resolve(__dirname, "src/utils/"),
      "@config": resolve(__dirname, "src/config/"),
    },
  },
  server: {
    port: 3000,
    open: true,
    host: true,
    allowedHosts: ["localhost.huawei.com", "localhost"],
  },
  build: {
    outDir: "dist",
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes("node_modules/phaser")) return "phaser";
        },
      },
    },
  },
  publicDir: "assets",
});
