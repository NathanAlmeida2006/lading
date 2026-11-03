import { renderToString } from "react-dom/server";
import { Aplicativo } from "../app/Aplicativo.jsx";

/** Usado so por scripts/prerenderizar.mjs, no build. */
export function renderizar() {
  return renderToString(<Aplicativo />);
}
