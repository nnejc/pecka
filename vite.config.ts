import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "./" keeps the static build working on GitHub Pages sub-paths and Vercel.
export default defineConfig({
  base: "./",
  plugins: [react()],
});
