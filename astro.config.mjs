import { defineConfig } from "astro/config";
import node from "@astrojs/node";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://thecareerinsights.com",
  output: "static",
  adapter: node({ mode: "standalone" }),
  integrations: [sitemap()],
  vite: {
    build: {
      target: "es2022"
    }
  }
});
