// Critério 5 do cartão: nenhum ciclo de imports em src/. Lê os imports estáticos, os reexports e os dinâmicos por regex e faz DFS com pilha.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, dirname, resolve, relative, extname } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "src");
// Lista de ciclos conhecidos e aceitos: vazia de propósito. Um ciclo achado aqui é falha, não entra na lista.
const CICLOS_ACEITOS = [];
const EXTENSOES_JS = [".js", ".jsx"];

function arquivosJs(dir) {
  return readdirSync(dir).flatMap((name) => {
    const caminho = join(dir, name);
    if (statSync(caminho).isDirectory()) return arquivosJs(caminho);
    return EXTENSOES_JS.includes(extname(name)) ? [caminho] : [];
  });
}

// Resolve um especificador relativo para um arquivo JS do src; devolve null para pacotes e ativos não JS.
function resolverImport(de, especificador) {
  const limpo = especificador.split("?")[0];
  if (!limpo.startsWith(".")) return null;
  const base = resolve(dirname(de), limpo);
  const ext = extname(base);
  if (ext && !EXTENSOES_JS.includes(ext)) return null;
  const candidatos = ext ? [base] : EXTENSOES_JS.map((e) => base + e);
  return candidatos.find((c) => existsSync(c)) ?? null;
}

function grafo() {
  const arestas = new Map();
  for (const arquivo of arquivosJs(raiz)) {
    const text = readFileSync(arquivo, "utf8");
    const alvos = new Set();
    const padroes = [
      /\bfrom\s+["']([^"']+)["']/g,
      /^\s*import\s+["']([^"']+)["']/gm,
      /\bimport\(\s*["']([^"']+)["']\s*\)/g,
    ];
    for (const re of padroes) {
      for (const m of text.matchAll(re)) {
        const alvo = resolverImport(arquivo, m[1]);
        if (alvo) alvos.add(alvo);
      }
    }
    arestas.set(arquivo, [...alvos]);
  }
  return arestas;
}

// DFS com pilha de recursão: devolve o primeiro ciclo achado como lista de caminhos, ou null.
function acharCiclo(arestas) {
  const visitados = new Set();
  const pilha = [];
  const noPilha = new Set();
  function visitar(no) {
    if (noPilha.has(no)) {
      const inicio = pilha.indexOf(no);
      return [...pilha.slice(inicio), no];
    }
    if (visitados.has(no)) return null;
    visitados.add(no);
    pilha.push(no);
    noPilha.add(no);
    for (const vizinho of arestas.get(no) ?? []) {
      const achado = visitar(vizinho);
      if (achado) return achado;
    }
    pilha.pop();
    noPilha.delete(no);
    return null;
  }
  for (const no of arestas.keys()) {
    const achado = visitar(no);
    if (achado) return achado;
  }
  return null;
}

test("src/ tem arquivos JS a varrer (sanidade do grafo)", () => {
  assert.ok(grafo().size > 50, "poucos arquivos no grafo");
});

test("o grafo de imports de src/ nao tem ciclo (inclui imports dinamicos)", () => {
  const arestas = grafo();
  const ciclo = acharCiclo(arestas);
  const text = ciclo ? ciclo.map((c) => relative(raiz, c)).join(" -> ") : "";
  assert.equal(ciclo, null, `ciclo de imports: ${text}`);
  assert.deepEqual(CICLOS_ACEITOS, []);
});

test("choreographies.js nao importa loader.js; openReadingMode mora em reading.js", () => {
  const arestas = grafo();
  const carregador = join(raiz, "sensory", "loader.js");
  const coreografias = join(raiz, "sensory", "choreographies.js");
  const leitura = join(raiz, "sensory", "reading.js");
  assert.ok(
    !(arestas.get(coreografias) ?? []).includes(carregador),
    "choreographies importa loader",
  );
  assert.ok(
    (arestas.get(coreografias) ?? []).includes(leitura),
    "choreographies deveria importar reading",
  );
});
