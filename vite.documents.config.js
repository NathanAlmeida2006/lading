import { defineConfig } from "vite";
import { supplierPlugin } from "./scripts/vite-supplier.mjs";

// As páginas legais (privacy.html, terms.html) são entradas HTML próprias, num segundo build que SOMA
// ao dist da landing (emptyOutDir: false): o grafo de chunks da landing não muda. O JS delas vai para
// dist/documents/, fora de dist/assets, que é o que scripts/check-size.mjs mede (RNF-L04).
export default defineConfig({
  plugins: [supplierPlugin()], // `<!--supplier-->` nas páginas vira o bloco de CONFIG.fornecedor
  build: {
    outDir: "dist",
    emptyOutDir: false,
    copyPublicDir: false, // public/ já foi copiado pelo build da landing; aqui não precisa de novo
    target: ["chrome90", "edge90", "firefox90", "safari15"], // o mesmo da landing (vite.config.js)
    cssTarget: "es2020",
    cssMinify: "esbuild",
    reportCompressedSize: false,
    rolldownOptions: {
      input: { privacy: "privacy.html", terms: "terms.html" },
      output: {
        entryFileNames: "documents/[name]-[hash].js",
        chunkFileNames: "documents/[name]-[hash].js",
        assetFileNames: "documents/[name]-[hash][extname]",
      },
    },
  },
});
