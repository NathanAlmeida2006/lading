import { defineConfig } from "vite";

// As páginas legais (privacy.html, terms.html) são entradas HTML próprias, num segundo build que SOMA
// ao dist da landing (emptyOutDir: false): o grafo de chunks da landing não muda. O JS delas vai para
// dist/documents/, fora de dist/assets, que é o que scripts/check-size.mjs mede (RNF-L04).
export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: false,
    copyPublicDir: false, // public/ ja foi copiado pelo build da landing; aqui nao precisa de novo
    target: ["chrome118", "edge118", "firefox146", "safari17.4"],
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
