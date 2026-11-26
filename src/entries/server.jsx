import { renderToString } from "react-dom/server";
import { App } from "../app/App.jsx";

/**
 * Usado só por scripts/prerender.mjs, no build.
 * @returns {string} O HTML da página, sem o documento em volta.
 */
export function render() {
  return renderToString(<App />);
}
