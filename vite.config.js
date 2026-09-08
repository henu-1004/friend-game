import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
export default defineConfig({
  base: "./",
  build: {
    rollupOptions: {
      input: {
        sandbag: fileURLToPath(new URL("./index.html", import.meta.url)),
        classic: fileURLToPath(new URL("./classic.html", import.meta.url)),
      },
    },
  },
});
