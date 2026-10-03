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

// `firstElementChild`, e nao `hasChildNodes`: em dev a raiz so tem o comentario do marcador,
// que conta como no e fazia o React tentar hidratar uma raiz vazia.
if (raiz.firstElementChild) {
  hydrateRoot(raiz, arvore);
} else {
  createRoot(raiz).render(arvore);
}

