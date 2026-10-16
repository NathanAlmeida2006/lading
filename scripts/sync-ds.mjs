/**
 * Traz tokens e fontes de `.design-sync/ds-bundle/` para dentro do build.
 *
 * O ds-bundle e traducao do mestre visual, e em divergencia o mestre vence
 * (RNF-L18). Por isso nada aqui e editado a mao: o que chega e copia, versionada
 * no repo (o build fora desta maquina nao enxerga o ds-bundle). Divergiu? Corrige la e
 * roda de novo, e commita o resultado.
 *
 * Caminho da base sobrescrevivel por DS_BUNDLE, para quem clonar em outro lugar.
 */
import { cp, mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { execFile } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const executar = promisify(execFile);
const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const bundle = resolve(
  process.env.DS_BUNDLE ?? join(raiz, "..", "projetos", ".design-sync", "ds-bundle"),
);

const TOKENS = ["cor.css", "forma-espaco.css", "movimento.css"];

// Tres familias, nunca quatro na mesma peca (RF-G05, TR-05).
//
// Duas familias, nao tres. A Fonte Marca saiu em 05/09/2026 e a Principal de
// Suporte saiu no mesmo dia: quem assina, anuncia e rotula e a SECUNDARIA, em
// muitos pesos e escalas, e a Terciaria explica.
//
// Uma familia so carregando a hierarquia inteira e o primeiro principio que a
// engenharia reversa do Burocratik manda importar. De quebra, o orcamento de
// fonte cai de 120,6 KB para 79,2 KB contra o teto de 130 do RNF-L05.
//
// So o subset `latin` (U+0000-00FF): ele ja cobre todo o pt-BR, acentos e
// cedilha inclusos. O latin-ext somaria 88 KB para atender lingua que esta
// pagina nao fala, e estouraria o teto de 130 KB do RNF-L05.
const FONTES = [
  "big-shoulders-display-latin.woff2",
  "ibm-plex-sans-latin.woff2",
];

const ASSINATURA = "big-shoulders-display-latin.woff2";

async function main() {
  const destinoTokens = join(raiz, "src", "styles", "tokens");
  const destinoFontes = join(raiz, "public", "fonts");

  if (!existsSync(bundle)) {
    // Builds fora da maquina de design (Vercel, CI) nao enxergam o
    // ds-bundle local. Sem ele, seguimos com a ultima copia sincronizada
    // e versionada no repo - so falha se nem essa copia existir.
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

  for (const arquivo of TOKENS) {
    await cp(join(bundle, "tokens", arquivo), join(destinoTokens, arquivo));
  }
  console.log(`sync:ds  ${TOKENS.length} arquivos de token`);

  for (const arquivo of FONTES) {
    await cp(join(bundle, "fonts", arquivo), join(destinoFontes, arquivo));
  }
  console.log(`sync:ds  ${FONTES.length} familias variaveis, subset latin`);

  await prepararWordmark();
  await gerarFavicon();
}

/**
 * O wordmark sai em contornos convertidos, e nao em texto vivo, porque o
 * RF-G04 exige que a assinatura seja identica em toda peca.
 *
 * Sem python3 ou sem fontTools a pagina continua de pe com texto vivo, o que
 * quebra o RF-G04. O que se perde esta no aviso, nao em silencio.
 */
async function prepararWordmark() {
  const svg = join(raiz, "src", "assets", "wordmark.svg");
  try {
    const { stdout } = await executar("python3", [
      join(raiz, "scripts", "wordmark.py"),
      join(bundle, "fonts", ASSINATURA),
      svg,
    ]);
    process.stdout.write(`sync:ds${stdout}`);
  } catch (erro) {
    await writeFile(svg, WORDMARK_TEXTO, "utf8");
    console.warn(
      `sync:ds  AVISO  wordmark.py falhou (${erro.code ?? erro.message}).\n` +
        `         O wordmark virou texto vivo, o que quebra RF-G04. Instale\n` +
        `         python3 e fonttools[woff] antes de publicar.`,
    );
  }
}

// Fallback so: texto vivo, com a cadeia de fallback do RF-G06.
const WORDMARK_TEXTO =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 110" role="img" aria-label="LITHIUM">` +
  `<text x="0" y="88" fill="currentColor" font-size="100" font-weight="700" letter-spacing="2"` +
  ` font-family="Big Shoulders Display, Oswald, Arial Narrow, sans-serif">LITHIUM</text></svg>`;

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
