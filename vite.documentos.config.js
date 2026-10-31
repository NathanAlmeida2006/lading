import { defineConfig } from "vite";

// As páginas legais (privacidade.html, termos.html) são entradas HTML próprias, num segundo build que SOMA
// ao dist da landing (emptyOutDir: false): o grafo de chunks da landing não muda. O JS delas vai para
// dist/documentos/, fora de dist/assets, que é o que scripts/check-size.mjs mede (RNF-L04).
export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: false,
    copyPublicDir: false, // public/ ja foi copiado pelo build da landing; aqui so resolve /fonts/*
    target: ["chrome118", "edge118", "firefox146", "safari17.4"],
    cssTarget: "es2020",
    reportCompressedSize: false,
    rollupOptions: {
      input: { privacidade: "privacidade.html", termos: "termos.html" },
      output: {
        entryFileNames: "documentos/[name]-[hash].js",
        chunkFileNames: "documentos/[name]-[hash].js",
        assetFileNames: "documentos/[name]-[hash][extname]",
      },
    },
  },
});
