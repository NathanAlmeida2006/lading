import { renderToString } from "react-dom/server";
import { App } from "./App.jsx";

/** Usado so por scripts/prerender.mjs, no build. */
export function renderizar() {
  return renderToString(<App />);
}
