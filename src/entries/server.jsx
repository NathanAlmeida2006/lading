import { renderToString } from "react-dom/server";
import { App } from "../app/App.jsx";

/**
 * Usado so por scripts/prerender.mjs, no build.
 * @returns {string} O HTML da pagina, sem o documento em volta.
 */
export function render() {
  return renderToString(<App />);
}
