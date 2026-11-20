import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fornecedorPlugin } from "./scripts/vite-fornecedor.mjs";

// Uma pagina so (RF-L01), build estatico (RF-L04), sem CDN em tempo de
// execucao (RNF-L08): tudo o que a pagina precisa sai deste bundle. O Tailwind
// roda so no build (src/styles/tailwind.css), com o tema apontando para os
// tokens do ds-bundle.
export default defineConfig(({ isSsrBuild }) => ({
  // fornecedorPlugin: so serve as paginas legais no `npm run dev`; o build delas usa vite.documents.config.js.
  plugins: [react(), tailwindcss(), fornecedorPlugin()],
  // O ano do rodape e o do build: `new Date()` no cliente divergiria do HTML
  // pre-renderizado na virada do ano e quebraria a hidratacao.
  define: { __ANO__: JSON.stringify(new Date().getFullYear()) },
  build: {
    // O JS e transpilado para WebViews moveis mais antigas (iOS 15 em diante, Chrome e Firefox 90). O CSS das telas do
    // video nao usa mais `@scope`, que exigia Chrome 118 / Safari 17.4 / Firefox 146. O CSS segue minificado como antes (`cssTarget`).
    // Limite: o transpilador so reescreve SINTAXE; API de navegador (ex.: `inert`) e CSS do Tailwind v4 (`@property`, `color-mix`) tem piso proprio.
    target: ["chrome90", "edge90", "firefox90", "safari15"],
    cssTarget: "es2020",
    // O Vite 8 minifica o CSS com o Lightning CSS por padrao; o esbuild mantem a saida do Vite 6 (regra do pixel).
    // Exige o pacote esbuild em devDependencies (par opcional do Vite 8).
    cssMinify: "esbuild",
    assetsInlineLimit: 2048,
    // `scripts/check-size.mjs` ja mede o gzip contra o teto do RNF-L04, e a
    // conta do Vite refaz a mesma compressao em cada arquivo, so para imprimir.
    reportCompressedSize: false,
    // O build SSR so gera server.js: nao copia public/ (8,2 MB sem uso).
    copyPublicDir: !isSsrBuild,
  },
}));
