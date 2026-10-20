import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    // The dev server exposes the project root: private API files must never be assets.
    fs: {
      strict: true,
      deny: [
        ".env",
        ".env.*",
        "*.{crt,pem}",
        "**/.git/**",
        "**/.data/**",
        "**/.codex/**",
        "**/.agents/**",
        "**/.aws/**",
        "**/server/**",
        "**/*.sqlite",
        "**/*.sqlite-*",
        "**/*.key",
        "**/IMG_*.heic",
        "**/IMG_*.jpeg",
        "**/tmp.gif",
      ],
    },
    proxy: {
      "/api": {
        target: `http://127.0.0.1:${process.env.DCB_API_PORT || 8787}`,
        changeOrigin: false,
      },
    },
  },
});
