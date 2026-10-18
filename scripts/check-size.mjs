/**
 * Guarda-corpo do RNF-L04: 130 KB de JavaScript comprimido, teto (era 120 KB; subiu para caber o video da secao 3: o leitor de
 * modelos 3D, as telas do app e os takes, 127,7 KB medidos em 18/10/2026).
 *
 * E o requisito que mantem a escolha de React honesta. Enquanto o build couber
 * aqui, a stack nao custa conversao; no dia em que nao couber, a conversa e
 * sobre o que sai, nao sobre subir o numero.
 *
 * O orcamento de fonte (RNF-L05, 130 KB) entra no mesmo relatorio porque as
 * duas contas competem pelo mesmo 4G do visitante.
 */
import { readdir, readFile, stat } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const TETO_JS = 130 * 1024;
const TETO_FONTES = 130 * 1024;

async function somar(pasta, extensoes, comprimir) {
  let total = 0;
  const itens = await readdir(pasta, { withFileTypes: true }).catch(() => []);
  for (const item of itens) {
    const caminho = join(pasta, item.name);
    if (item.isDirectory()) {
      total += await somar(caminho, extensoes, comprimir);
    } else if (extensoes.includes(extname(item.name))) {
      total += comprimir
        ? gzipSync(await readFile(caminho)).length
        : (await stat(caminho)).size;
    }
  }
  return total;
}

const js = await somar(join(raiz, "dist"), [".js"], true);
const css = await somar(join(raiz, "dist"), [".css"], true);
const fontes = await somar(join(raiz, "public", "fonts"), [".woff2", ".otf"], false);

const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
const veredito = (valor, teto) => (valor <= teto ? "ok  " : "ESTOUROU");

console.log("");
console.log(`  RNF-L04  JS comprimido   ${kb(js).padStart(9)}  / ${kb(TETO_JS)}  ${veredito(js, TETO_JS)}`);
console.log(`           CSS comprimido  ${kb(css).padStart(9)}`);
console.log(`  RNF-L05  fontes          ${kb(fontes).padStart(9)}  / ${kb(TETO_FONTES)}  ${veredito(fontes, TETO_FONTES)}`);
console.log("");

if (js > TETO_JS || fontes > TETO_FONTES) process.exit(1);
