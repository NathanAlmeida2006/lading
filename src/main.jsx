import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { App } from "./App.jsx";

/**
 * O build injeta o HTML da pagina em `index.html` antes de publicar, entao em
 * producao aqui e hidratacao, nao renderizacao do zero (RNF-L16 e RNF-L01).
 * Em `npm run dev` a raiz esta vazia e o caminho e o normal.
 */
const raiz = document.getElementById("raiz");
const arvore = (
  <StrictMode>
    <App />
  </StrictMode>
);

if (raiz.hasChildNodes()) {
  hydrateRoot(raiz, arvore);
} else {
  createRoot(raiz).render(arvore);
}
