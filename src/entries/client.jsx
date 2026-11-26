import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { App } from "../app/App.jsx";

/**
 * O build injeta o HTML da página em `index.html` antes de publicar, então em
 * produção aqui é hidratação, não renderização do zero (RNF-L16 e RNF-L01).
 * Em `npm run dev` a raiz está vazia e o caminho é o normal.
 */
const root = document.getElementById("raiz");
const tree = (
  <StrictMode>
    <App />
  </StrictMode>
);

// `firstElementChild`, e não `hasChildNodes`: em dev a raiz só tem o comentário do marcador,
// que conta como nó e fazia o React tentar hidratar uma raiz vazia.
if (root.firstElementChild) {
  hydrateRoot(root, tree);
} else {
  createRoot(root).render(tree);
}
