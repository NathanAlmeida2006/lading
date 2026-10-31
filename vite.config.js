import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Uma pagina so (RF-L01), build estatico (RF-L04), sem CDN em tempo de
// execucao (RNF-L08): tudo o que a pagina precisa sai deste bundle. O Tailwind
// roda so no build (src/styles/tailwind.css), com o tema apontando para os
// tokens do ds-bundle.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // O ano do rodape e o do build: `new Date()` no cliente divergiria do HTML
  // pre-renderizado na virada do ano e quebraria a hidratacao.
  define: { __ANO__: JSON.stringify(new Date().getFullYear()) },
  build: {
    // O piso e o que o `@scope` das telas do video exige (Chrome 118, Safari 17.4, Firefox 146), e abaixo
    // dele o esbuild so transpilaria a toa. O CSS segue minificado como antes (`cssTarget`), byte a byte.
    target: ["chrome118", "edge118", "firefox146", "safari17.4"],
    cssTarget: "es2020",
    assetsInlineLimit: 2048,
    // `scripts/check-size.mjs` ja mede o gzip contra o teto do RNF-L04, e a
    // conta do Vite refaz a mesma compressao em cada arquivo, so para imprimir.
    reportCompressedSize: false,
  },
});
