// Criterio 5 do cartao: nenhum ciclo de imports em src/. Le os imports estaticos, os reexports e os dinamicos por regex e faz DFS com pilha.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, dirname, resolve, relative, extname } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "src");
// Lista de ciclos conhecidos e aceitos: vazia de proposito. Um ciclo achado aqui e falha, nao entra na lista.
const CICLOS_ACEITOS = [];
const EXTENSOES_JS = [".js", ".jsx"];

function arquivosJs(dir) {
  return readdirSync(dir).flatMap((nome) => {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) return arquivosJs(caminho);
    return EXTENSOES_JS.includes(extname(nome)) ? [caminho] : [];
  });
}

// Resolve um especificador relativo para um arquivo JS do src; devolve null para pacotes e ativos nao JS.
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
    const texto = readFileSync(arquivo, "utf8");
    const alvos = new Set();
    const padroes = [/\bfrom\s+["']([^"']+)["']/g, /^\s*import\s+["']([^"']+)["']/gm, /\bimport\(\s*["']([^"']+)["']\s*\)/g];
    for (const re of padroes) {
      for (const m of texto.matchAll(re)) {
        const alvo = resolverImport(arquivo, m[1]);
        if (alvo) alvos.add(alvo);
      }
    }
    arestas.set(arquivo, [...alvos]);
  }
  return arestas;
}

// DFS com pilha de recursao: devolve o primeiro ciclo achado como lista de caminhos, ou null.
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
  const texto = ciclo ? ciclo.map((c) => relative(raiz, c)).join(" -> ") : "";
  assert.equal(ciclo, null, `ciclo de imports: ${texto}`);
  assert.deepEqual(CICLOS_ACEITOS, []);
});

test("coreografias.js nao importa carregador.js; abrirLeitura mora em leitura.js", () => {
  const arestas = grafo();
  const carregador = join(raiz, "sensorial", "carregador.js");
  const coreografias = join(raiz, "sensorial", "coreografias.js");
  const leitura = join(raiz, "sensorial", "leitura.js");
  assert.ok(!(arestas.get(coreografias) ?? []).includes(carregador), "coreografias importa carregador");
  assert.ok((arestas.get(coreografias) ?? []).includes(leitura), "coreografias deveria importar leitura");
});
