import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import mdx from "@mdx-js/rollup";
import pluginRewriteAll from "vite-plugin-rewrite-all";

export default defineConfig({
  plugins: [
    { enforce: "pre", ...mdx() },
    react({
      include: /\.(mdx|js|jsx|ts|tsx)$/,
      jsxImportSource: "@emotion/react",
      jsxRuntime: "classic",
    }),
    pluginRewriteAll(),
  ],
  resolve: {
    alias: [
      { find: "@assets", replacement: "/src/assets" },
      { find: "@components", replacement: "/src/components" },
      { find: "@modules", replacement: "/src/modules" },
      { find: "@redux", replacement: "/src/redux" },
      { find: "@router", replacement: "/src/router" },
      { find: "@services", replacement: "/src/services" },
      { find: "@ui-controls", replacement: "/src/ui-controls" },
      { find: "@style", replacement: "/src/style" },
    ],
  },
  server: {
    port: 3001,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("@mui/")) {
              return id
                .toString()
                .split("node_modules/")[1]
                .split("/")[1]
                .toString();
            }
            return id
              .toString()
              .split("node_modules/")[1]
              .split("/")[0]
              .toString();
          }
        },
      },
    },
  },
});
