import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Uma pagina so (RF-L01), build estatico (RF-L04), sem CDN em tempo de
// execucao (RNF-L08): tudo o que a pagina precisa sai deste bundle.
export default defineConfig({
  plugins: [react()],
  build: {
    target: "es2020",
    assetsInlineLimit: 2048,
    // `scripts/check-size.mjs` ja mede o gzip contra o teto do RNF-L04, e a
    // conta do Vite refaz a mesma compressao em cada arquivo, so para imprimir.
    reportCompressedSize: false,
  },
});
