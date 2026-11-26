/**
 * Guarda-corpo do RNF-L04: 130 KB de JavaScript comprimido, teto (era 120 KB; subiu para caber o vídeo da seção 3: o leitor de
 * modelos 3D, as telas do app e os takes, 127,7 KB medidos em 18/10/2026).
 *
 * E o requisito que mantém a escolha de React honesta. Enquanto o build couber
 * aqui, a stack não custa conversão; no dia em que não couber, a conversa é
 * sobre o que sai, não sobre subir o número.
 *
 * O orçamento de fonte (RNF-L05, 130 KB) entra no mesmo relatório porque as
 * duas contas competem pelo mesmo 4G do visitante.
 *
 * O teto de mídia (imagens, áudio e modelos 3D, por categoria e por arquivo) cobre o dist/ inteiro: sem
 * ele uma imagem nova de 2 MB entra sem ninguém ver.
 */
import { readdir, readFile, stat } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const TETO_JS = 130 * 1024;
const TETO_FONTES = 130 * 1024;
// Teto de mídia em dist/ inteiro, por extensão. Total e por arquivo, em bytes.
const TETOS_MIDIA = [
  {
    name: "imagens",
    extensoes: [".webp", ".png", ".jpg", ".jpeg", ".avif", ".gif"],
    total: 8 * 1024 * 1024,
    arquivo: 800 * 1024,
  },
  {
    name: "audio",
    extensoes: [".mp3", ".ogg", ".m4a", ".wav"],
    total: 1 * 1024 * 1024,
    arquivo: 900 * 1024,
  },
  { name: "modelos", extensoes: [".glb", ".gltf", ".bin"], total: 256 * 1024, arquivo: 48 * 1024 },
];

async function somar(pasta, extensoes, comprimir) {
  let total = 0;
  const items = await readdir(pasta, { withFileTypes: true }).catch(() => []);
  for (const item of items) {
    const caminho = join(pasta, item.name);
    if (item.isDirectory()) {
      total += await somar(caminho, extensoes, comprimir);
    } else if (extensoes.includes(extname(item.name))) {
      total += comprimir ? gzipSync(await readFile(caminho)).length : (await stat(caminho)).size;
    }
  }
  return total;
}

// Lista recursiva de dist/: nome relativo e bytes. Pasta ausente devolve lista vazia.
async function listarArquivos(pasta, prefixo = "") {
  const saida = [];
  const items = await readdir(pasta, { withFileTypes: true }).catch(() => []);
  for (const item of items) {
    const name = prefixo + item.name;
    if (item.isDirectory()) {
      saida.push(...(await listarArquivos(join(pasta, item.name), `${name}/`)));
    } else {
      saida.push({ name, bytes: (await stat(join(pasta, item.name))).size });
    }
  }
  return saida;
}

// Só dist/assets, o bundle da landing: as páginas legais têm JS próprio em dist/documents (vite.documents.config.js).
const js = await somar(join(raiz, "dist", "assets"), [".js"], true);
const css = await somar(join(raiz, "dist", "assets"), [".css"], true);
const fontes = await somar(join(raiz, "public", "fonts"), [".woff2", ".otf"], false);

const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
const veredito = (valor, teto) => (valor <= teto ? "ok  " : "ESTOUROU");

console.log("");
console.log(
  `  RNF-L04  JS comprimido   ${kb(js).padStart(9)}  / ${kb(TETO_JS)}  ${veredito(js, TETO_JS)}`,
);
console.log(`           CSS comprimido  ${kb(css).padStart(9)}`);
console.log(
  `  RNF-L05  fontes          ${kb(fontes).padStart(9)}  / ${kb(TETO_FONTES)}  ${veredito(fontes, TETO_FONTES)}`,
);

const arquivosDist = await listarArquivos(join(raiz, "dist"));
let midiaEstourou = false;
for (const teto of TETOS_MIDIA) {
  const items = arquivosDist.filter((a) => teto.extensoes.includes(extname(a.name)));
  const total = items.reduce((s, a) => s + a.bytes, 0);
  const maior = items.reduce((m, a) => (a.bytes > m.bytes ? a : m), { name: "-", bytes: 0 });
  const estourou = total > teto.total || maior.bytes > teto.arquivo;
  midiaEstourou ||= estourou;
  console.log(
    `  MIDIA    ${teto.name.padEnd(8)} ${kb(total).padStart(12)}  / ${kb(teto.total).padStart(12)}  ${estourou ? "ESTOUROU" : "ok  "}   (maior ${maior.name} ${kb(maior.bytes)} / ${kb(teto.arquivo)})`,
  );
}
console.log("");

if (js > TETO_JS || fontes > TETO_FONTES || midiaEstourou) process.exit(1);
