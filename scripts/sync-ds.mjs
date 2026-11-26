/**
 * Traz tokens e fontes de `.design-sync/ds-bundle/` para dentro do build.
 *
 * O ds-bundle é tradução do mestre visual, e em divergência o mestre vence
 * (RNF-L18). Por isso nada aqui é editado à mão: o que chega é cópia, versionada
 * no repo (o build fora desta máquina não enxerga o ds-bundle). Divergiu? Corrige lá e
 * roda de novo, e commita o resultado.
 *
 * Caminho da base sobrescrevível por DS_BUNDLE, para quem clonar em outro lugar.
 * O wordmark NÃO é gerado aqui: src/assets/wordmark.svg é um traçado versionado e editado à mão
 * (a assinatura aprovada); o sync não o lê nem o grava.
 */
import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const bundle = resolve(
  process.env.DS_BUNDLE ?? join(raiz, "..", "projetos", ".design-sync", "ds-bundle"),
);

// Chave: nome no ds-bundle (leitura). Valor: nome em src/styles/tokens/ (gravação).
const TOKENS = {
  "cor.css": "color.css",
  "forma-espaco.css": "shape-spacing.css",
  "movimento.css": "motion.css",
};

// O pacote do ds-bundle mantém os nomes do mestre visual; o repo usa os nomes em inglês
// (Regra da Fronteira Única). Por isso a cópia traduz estes tokens. Renomear token exige
// atualizar o mapa da Fase 2b, nunca o pacote.
const TOKEN_NAMES = {
  "--acento": "--accent",
  "--ease-corte-2": "--ease-cut-2",
  "--ease-corte-3": "--ease-cut-3",
  "--font-marca": "--font-mark",
  "--font-principal": "--font-main",
  "--font-secundaria": "--font-secondary",
  "--font-terciaria": "--font-tertiary",
  "--medida-max": "--measure-max",
  "--min-corpo": "--min-body",
  "--min-marca": "--min-mark",
  "--min-principal": "--min-main",
  "--motion-celebracao": "--motion-celebration",
  "--peso-black": "--weight-black",
  "--peso-bold": "--weight-bold",
  "--peso-medio": "--weight-medium",
  "--peso-regular": "--weight-regular",
  "--peso-semi": "--weight-semi",
  "--praga": "--pest",
  "--rubro": "--crimson",
  "--vigilia": "--vigil",
};

// Três famílias, nunca quatro na mesma peça (RF-G05, TR-05).
//
// Duas famílias, não três. A Fonte Marca saiu em 05/09/2026 e a Principal de
// Suporte saiu no mesmo dia: quem assina, anuncia e rotula e a SECUNDARIA, em
// muitos pesos e escalas, e a Terciaria explica.
//
// Uma família só carregando a hierarquia inteira e o primeiro princípio que a
// engenharia reversa do Burocratik manda importar. De quebra, o orçamento de
// fonte cai de 120,6 KB para 79,2 KB contra o teto de 130 do RNF-L05.
//
// Só o subset `latin` (U+0000-00FF): ele já cobre todo o pt-BR, acentos e
// cedilha inclusos. O latin-ext somaria 88 KB para atender língua que esta
// página não fala, e estouraria o teto de 130 KB do RNF-L05.
const FONTES = ["big-shoulders-display-latin.woff2", "ibm-plex-sans-latin.woff2"];

async function main() {
  const destinoTokens = join(raiz, "src", "styles", "tokens");
  const destinoFontes = join(raiz, "public", "fonts");

  if (!existsSync(bundle)) {
    // Builds fora da máquina de design (Vercel, CI) não enxergam o
    // ds-bundle local. Sem ele, seguimos com a última cópia sincronizada
    // e versionada no repo - só falha se nem essa cópia existir.
    if (existsSync(destinoTokens) && existsSync(destinoFontes)) {
      console.warn(
        `sync:ds  AVISO  ds-bundle nao encontrado em ${bundle}, usando copia ja versionada.`,
      );
      return;
    }
    console.error(
      `sync:ds  ds-bundle nao encontrado em ${bundle}, e nao ha copia versionada.\n` +
        `         aponte com DS_BUNDLE=/caminho/para/.design-sync/ds-bundle`,
    );
    process.exit(1);
  }

  await mkdir(destinoTokens, { recursive: true });
  await mkdir(destinoFontes, { recursive: true });

  for (const [origin, destino] of Object.entries(TOKENS)) {
    const text = await readFile(join(bundle, "tokens", origin), "utf8");
    await writeFile(join(destinoTokens, destino), traduzir(text), "utf8");
  }
  console.log(`sync:ds  ${Object.keys(TOKENS).length} arquivos de token`);

  for (const arquivo of FONTES) {
    await cp(join(bundle, "fonts", arquivo), join(destinoFontes, arquivo));
  }
  console.log(`sync:ds  ${FONTES.length} familias variaveis, subset latin`);

  await gerarFavicon();
}

// Seletores de classe que o pacote traz (a tipografia usa .marca); o repo renomeou essas classes,
// então a cópia troca igual, senão o sync reescreve o que a ferramenta já trocou.
const CLASS_NAMES = {
  ".marca": ".mark",
  ".marca-xl": ".mark-xl",
};

/** Troca cada nome de TOKEN_NAMES e CLASS_NAMES numa passada, pelo nome inteiro (sem pegar prefixo). */
function traduzir(text) {
  let saida = text;
  for (const roadmap of [TOKEN_NAMES, CLASS_NAMES]) {
    const nomes = Object.keys(roadmap).map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    const padrao = new RegExp(`(?<![\\w-])(${nomes.join("|")})(?![\\w-])`, "g");
    saida = saida.replace(padrao, (name) => roadmap[name]);
  }
  return saida;
}

/** Favicon: o ornamento do sigilo, SVG (RNF-L21), nos dois temas. */
async function gerarFavicon() {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">` +
    `<rect width="32" height="32" fill="#09090b"/>` +
    `<path d="M16 4 L27 16 L16 28 L5 16 Z" fill="none" stroke="#ededf0" stroke-width="2"/>` +
    `<path d="M16 11 L21 16 L16 21 L11 16 Z" fill="#d2202c"/>` +
    `</svg>`;
  await writeFile(join(raiz, "public", "favicon.svg"), svg, "utf8");
}

await main();
