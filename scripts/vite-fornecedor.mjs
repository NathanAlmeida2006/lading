// Plugin do Vite: troca `<!--fornecedor-->` nas paginas legais (privacy.html, terms.html) pelos dados de
// CONFIG.fornecedor. Os documentos sao HTML estatico, fora do React; esta e a unica ponte entre eles e a config.
import { CONFIG } from "../src/infra/config.js";

const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const escapeHtml = (text) => String(text).replace(/[&<>"']/g, (char) => ESCAPES[char]);

export function fornecedorPlugin() {
  const { contato } = CONFIG.fornecedor;
  const bloco =
    `<p>Contato: <a href="mailto:${escapeHtml(contato)}">${escapeHtml(contato)}</a>. ` +
    `O checkout e o processamento do pagamento são feitos pela Hotmart.</p>`;
  return { name: "fornecedor", transformIndexHtml: (html) => html.replaceAll("<!--fornecedor-->", bloco) };
}
