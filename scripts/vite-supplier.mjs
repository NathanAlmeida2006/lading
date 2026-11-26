// Plugin do Vite: troca `<!--supplier-->` nas páginas legais (privacy.html, terms.html) pelos dados de
// CONFIG.supplier. Os documentos são HTML estático, fora do React; esta é a única ponte entre eles e a config.
import { CONFIG } from "../src/infra/config.js";

const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const escapeHtml = (text) => String(text).replace(/[&<>"']/g, (char) => ESCAPES[char]);

export function supplierPlugin() {
  const { contact } = CONFIG.supplier;
  const bloco =
    `<p>Contato: <a href="mailto:${escapeHtml(contact)}">${escapeHtml(contact)}</a>. ` +
    `O checkout e o processamento do pagamento são feitos pela Hotmart.</p>`;
  return {
    name: "supplier",
    transformIndexHtml: (html) => html.replaceAll("<!--supplier-->", bloco),
  };
}
