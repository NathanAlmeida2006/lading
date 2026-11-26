import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { supplierPlugin } from "./scripts/vite-supplier.mjs";

// Uma página só (RF-L01), build estático (RF-L04), sem CDN em tempo de
// execução (RNF-L08): tudo o que a página precisa sai deste bundle. O Tailwind
// roda só no build (src/styles/tailwind.css), com o tema apontando para os
// tokens do ds-bundle.
export default defineConfig(({ isSsrBuild }) => ({
  // supplierPlugin: só serve as páginas legais no `npm run dev`; o build delas usa vite.documents.config.js.
  plugins: [react(), tailwindcss(), supplierPlugin()],
  // O ano do rodapé e o do build: `new Date()` no cliente divergiria do HTML
  // pré-renderizado na virada do ano e quebraria a hidratação.
  define: { __ANO__: JSON.stringify(new Date().getFullYear()) },
  build: {
    // O JS e transpilado para WebViews móveis mais antigas (iOS 15 em diante, Chrome e Firefox 90). O CSS das telas do
    // vídeo não usa mais `@scope`, que exigia Chrome 118 / Safari 17.4 / Firefox 146. O CSS segue minificado como antes (`cssTarget`).
    // Limite: o transpilador só reescreve SINTAXE; API de navegador (ex.: `inert`) e CSS do Tailwind v4 (`@property`, `color-mix`) tem piso próprio.
    target: ["chrome90", "edge90", "firefox90", "safari15"],
    cssTarget: "es2020",
    // O Vite 8 minifica o CSS com o Lightning CSS por padrão; o esbuild mantém a saída do Vite 6 (regra do pixel).
    // Exige o pacote esbuild em devDependencies (par opcional do Vite 8).
    cssMinify: "esbuild",
    assetsInlineLimit: 2048,
    // `scripts/check-size.mjs` já mede o gzip contra o teto do RNF-L04, e a
    // conta do Vite refaz a mesma compressão em cada arquivo, só para imprimir.
    reportCompressedSize: false,
    // O build SSR só gera server.js: não copia public/ (8,2 MB sem uso).
    copyPublicDir: !isSsrBuild,
  },
}));
