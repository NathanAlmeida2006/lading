/**
 * Injeta o HTML da pagina dentro de dist/index.html.
 *
 * Existe por causa do RNF-L16: a pagina precisa ser legivel ate o fim sem
 * JavaScript. Uma SPA React entrega <div id="raiz"></div> e mais nada, o que
 * reprovaria o requisito e ainda atrasaria o LCP do RNF-L01. Pre-renderizar no
 * build resolve os dois de uma vez, e o cliente so hidrata.
 */
import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { isRealEmail, isRealText as texto, getDocumentUrl, getTestimonialIssues, getRatingIssues } from "../src/infra/validation.js";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const molde = join(raiz, "dist", "index.html");

const { CONFIG } = await import(pathToFileURL(join(raiz, "src", "infra", "config.js")).href);
const { SECTIONS } = await import(pathToFileURL(join(raiz, "src", "content", "sections.js")).href);
const faltam = [];
const falta = (campo, motivo) => faltam.push(`${campo}: ${motivo}`);
const afirmacao = (campo, valido, motivo = "informação ausente ou inválida") => {
  if (!valido) falta(campo, motivo);
};
const preco = (valor) => typeof valor === "number"
  ? Number.isFinite(valor) && valor > 0
  : texto(valor) && /^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{2})?$/.test(valor) && Number(valor.replaceAll(".", "").replace(",", ".")) > 0;
const valorNumericoPreco = (valor) => typeof valor === "number"
  ? valor
  : Number(valor.replaceAll(".", "").replace(",", "."));
const urlHttps = (valor) => {
  try {
    const url = new URL(valor);
    return url.protocol === "https:" && Boolean(url.hostname) && !/definir/i.test(url.hostname + url.pathname);
  } catch { return false; }
};

for (const secao of SECTIONS) {
  if (!secao.presente) afirmacao(`secoes.${secao.id}.justificativaAusencia`, texto(secao.justificativaAusencia), "seção omitida sem justificativa de conteúdo");
}
if (CONFIG.secoes.amostra.ativo) {
  afirmacao("secoes.amostra.trechoReal", texto(CONFIG.secoes.amostra.trechoReal));
  afirmacao("secoes.amostra.origem", texto(CONFIG.secoes.amostra.origem));
}

afirmacao("oferta.preco", preco(CONFIG.pilhaDeValor.oferta.preco), "preço à vista ausente ou inválido");
afirmacao("oferta.pix.ativo", CONFIG.oferta.pix?.ativo === true, "Pix precisa estar disponível");
afirmacao("oferta.pix.confirmado", CONFIG.oferta.pix?.confirmado === true, "Pix não confirmado");
afirmacao("oferta.pix.valor", preco(CONFIG.oferta.pix?.valor), "valor em Pix não confirmado");
if (preco(CONFIG.pilhaDeValor.oferta.preco) && preco(CONFIG.oferta.pix?.valor)) {
  afirmacao("oferta.pix.valor", valorNumericoPreco(CONFIG.oferta.pix.valor) === valorNumericoPreco(CONFIG.pilhaDeValor.oferta.preco), "o valor em Pix diverge do preço exibido");
}
if (CONFIG.oferta.parcelamento != null) afirmacao("oferta.parcelamento", texto(CONFIG.oferta.parcelamento));
afirmacao("oferta.garantiaDias", Number.isInteger(CONFIG.oferta.garantiaDias) && CONFIG.oferta.garantiaDias > 0, "prazo em dias ausente");
afirmacao("oferta.garantiaCondicoes", texto(CONFIG.oferta.garantiaCondicoes), "condições de reembolso ausentes");
afirmacao("oferta.garantiaCanal", texto(CONFIG.oferta.garantiaCanal), "canal para pedir reembolso ausente");
afirmacao("entrega.formato", CONFIG.entrega.formato === "app", "entrega do app precisa estar declarada");
for (const campo of ["canal", "modoDeAcesso", "prazo"]) afirmacao(`entrega.${campo}`, texto(CONFIG.entrega[campo]));

afirmacao("checkout.url", urlHttps(CONFIG.checkout.url) && CONFIG.checkout.urlConfirmada === true,
  "URL HTTPS real do checkout ainda não confirmada na configuração");
afirmacao("checkout.parametroRastreio", /^[a-zA-Z][\w-]*$/.test(CONFIG.checkout.parametroRastreio ?? "") && CONFIG.checkout.parametroConfirmado === true,
  "nome do parâmetro de rastreio ainda não confirmado na conta");
// O Vite injeta VITE_META_PIXEL_ID no bundle; aqui (Node puro) le-se o mesmo valor do .env ou do ambiente.
try { process.loadEnvFile(join(raiz, ".env")); } catch { /* sem .env: vale o ambiente */ }
afirmacao("pixel.id", /^\d+$/.test(String(CONFIG.pixel.id ?? process.env.VITE_META_PIXEL_ID ?? "")), "ID do Pixel ausente (VITE_META_PIXEL_ID)");
afirmacao("clarity.id", /^[a-z0-9]+$/i.test(String(CONFIG.clarity.id ?? process.env.VITE_CLARITY_ID ?? "")), "ID do Clarity ausente (VITE_CLARITY_ID): sem ele o script nunca carrega em producao");
afirmacao("fornecedor.contato", isRealEmail(CONFIG.fornecedor.contato), "e-mail de contato ausente ou inválido");

// A mesma regra do rodape (src/infra/validation.js): o que ele esconderia, o build recusa.
const documentoLegal = async (campo) => {
  const valor = CONFIG.legal[campo];
  if (!texto(valor)) return falta(`legal.${campo}`, "referência ausente");
  const referencia = getDocumentUrl(valor);
  if (!referencia) return falta(`legal.${campo}`, "use URL HTTPS sem credenciais ou arquivo estático publicado");
  if (!referencia.startsWith("/")) return;
  const caminho = resolve(raiz, "dist", `.${referencia}`);
  try { if (!(await stat(caminho)).isFile()) throw new Error("não é arquivo"); }
  catch { falta(`legal.${campo}`, `documento estático não existe em dist${referencia}`); }
};
await Promise.all([documentoLegal("politicaPrivacidade"), documentoLegal("termosDeUso")]);

for (const [indice, bonus] of CONFIG.oferta.bonus.entries()) {
  for (const campo of ["id", "nome", "descricao", "origem"]) afirmacao(`oferta.bonus[${indice}].${campo}`, texto(bonus[campo]));
  afirmacao(`oferta.bonus[${indice}].confirmado`, bonus.confirmado === true, "bônus não confirmado");
}
const ancoragem = CONFIG.oferta.ancoragem;
if (ancoragem) {
  afirmacao("oferta.ancoragem.precoComparativo", preco(ancoragem.precoComparativo), "preço comparativo ausente ou inválido");
  afirmacao("oferta.ancoragem.fundamento", texto(ancoragem.fundamento));
  afirmacao("oferta.ancoragem.fonte", texto(ancoragem.fonte));
  afirmacao("oferta.ancoragem.confirmado", ancoragem.confirmado === true, "ancoragem comercial não confirmada");
}
if (CONFIG.pilhaDeValor.ativo === true) {
  afirmacao("pilhaDeValor.confirmado", CONFIG.pilhaDeValor.confirmado === true, "pilha de valor sem confirmação do gerente");
}
// Prova social: a mesma regra da tela (validation.js). O que ela esconderia, o build recusa.
for (const [indice, depoimento] of CONFIG.depoimentos.entries()) {
  for (const campo of getTestimonialIssues(depoimento)) {
    falta(`depoimentos[${indice}].${campo}`, campo === "aprovado" ? "print sem aprovação" : "lastro ausente ou inválido");
  }
}
const MOTIVO_NOTA = { nota: "nota fora de 0 ao máximo", fonte: "nota sem fonte", aprovado: "nota sem aprovação" };
for (const campo of getRatingIssues(CONFIG.avaliacao)) falta(`avaliacao.${campo}`, MOTIVO_NOTA[campo]);
afirmacao("oferta.disponivel", typeof CONFIG.oferta.disponivel === "boolean", "disponibilidade explícita da oferta-base obrigatória");

// A trava vale por padrão, em qualquer build (local, CI, Cloudflare): pendência recusa o build. Só a flag explícita
// ALLOW_UNCONFIRMED=1 a pula, para ver um preview local com dado ainda por confirmar.
if (faltam.length) {
  const aviso = `prerender  ${faltam.length} pendência(s) de publicação:\n  - ${faltam.join("\n  - ")}`;
  if (process.env.ALLOW_UNCONFIRMED === "1") {
    console.warn(`${aviso}\nALLOW_UNCONFIRMED=1: build de preview, NÃO publique este resultado.`);
  } else {
    console.error(`${aviso}\nBuild recusado. Preencha os dados em src/infra/config.js (ou, só para preview local, rode com ALLOW_UNCONFIRMED=1).`);
    process.exit(1);
  }
}

const { render } = await import(
  pathToFileURL(join(raiz, "dist-ssr", "server.js")).href
);

const html = await readFile(molde, "utf8");
const marcador = "<!--app-html-->";
if (!html.includes(marcador)) {
  console.error(`prerender  marcador ${marcador} sumiu de index.html`);
  process.exit(1);
}

const pagina = render();
const h1 = (pagina.match(/<h1(?:\s|>)/g) ?? []).length;
if (h1 !== 1) throw new Error(`prerender  esperado um h1; encontrados ${h1}`);
let posicao = -1;
for (const secao of SECTIONS.filter(({ presente }) => presente)) {
  const atual = pagina.indexOf(`id="${secao.id}"`);
  if (atual <= posicao) throw new Error(`prerender  seção ${secao.id} ausente ou fora da ordem RF-L08`);
  posicao = atual;
}
// Função, e não texto: `$&` ou `$$` na copy seriam lidos como padrão de substituição.
let saida = html.replace(marcador, () => pagina);

// CSS embutido (cartao 33): a folha era a unica requisicao a bloquear a primeira pintura. O arquivo fica em
// dist/ (o check-size o conta), so deixa de ser pedido. Sem o link, ou com `</style` no CSS, o build falha.
const ligacao = saida.match(/<link rel="stylesheet"[^>]*href="(\/assets\/[^"]+\.css)"[^>]*>/);
if (!ligacao) {
  console.error('prerender  <link rel="stylesheet"> de /assets/ nao encontrado em index.html');
  process.exit(1);
}
const css = await readFile(join(raiz, "dist", ligacao[1]), "utf8");
if (/<\/style/i.test(css)) {
  console.error("prerender  o CSS contem </style: nao pode ser embutido");
  process.exit(1);
}
saida = saida.replace(ligacao[0], () => `<style>${css}</style>`);

await writeFile(molde, saida, "utf8");

// A CSP de public/_headers admite o script inline so pelo hash; script alterado sem atualizar o _headers seria bloqueado em silencio na borda.
const csp = (await readFile(join(raiz, "public", "_headers"), "utf8")).match(/^\s*Content-Security-Policy:\s*(.+)$/m)?.[1];
if (!csp) {
  console.error("prerender  public/_headers sem linha Content-Security-Policy");
  process.exit(1);
}
const falhasCsp = [];
for (const arquivo of (await readdir(join(raiz, "dist"))).filter((nome) => nome.endsWith(".html"))) {
  const conteudoArquivo = await readFile(join(raiz, "dist", arquivo), "utf8");
  for (const [, atributos, conteudo] of conteudoArquivo.matchAll(/<script(?![^>]*\bsrc\s*=)([^>]*)>([\s\S]*?)<\/script>/g)) {
    const tipo = atributos.match(/\btype\s*=\s*["']?([^"'\s>]+)/i)?.[1];
    if (tipo && !/^(module|text\/javascript|application\/javascript)$/i.test(tipo)) continue;
    const hash = `sha256-${createHash("sha256").update(conteudo).digest("base64")}`;
    if (!csp.includes(`'${hash}'`)) falhasCsp.push(`  - ${arquivo}: ${hash} ausente da CSP`);
  }
}
if (falhasCsp.length) {
  console.error(`${falhasCsp.join("\n")}\nprerender  script inline sem hash em public/_headers. Atualize o sha256 em script-src (E1.1) e rode o build de novo.`);
  process.exit(1);
}

const posthogHost = process.env.VITE_POSTHOG_HOST;
if (posthogHost) {
  const posthogUrl = new URL(posthogHost);
  const posthogOrigins = new Set([posthogUrl.origin]);
  if (/^[^.]+\.i\./.test(posthogUrl.hostname)) {
    const assetsUrl = new URL(posthogUrl);
    assetsUrl.hostname = assetsUrl.hostname.replace(/^([^.]+)\.i\./, "$1-assets.i.");
    posthogOrigins.add(assetsUrl.origin);
  }
  const origens = [...posthogOrigins].join(" ");
  const caminhoCabecalhos = join(raiz, "dist", "_headers");
  let cabecalhos = await readFile(caminhoCabecalhos, "utf8");
  cabecalhos = cabecalhos.replace(/(script-src[^;]*)(;)/, `$1 ${origens}$2`);
  cabecalhos = cabecalhos.replace(/(connect-src[^;]*)(;)/, `$1 ${origens}$2`);
  await writeFile(caminhoCabecalhos, cabecalhos, "utf8");
}

console.log("prerender  index.html com a pagina dentro; chunks tardios sem modulepreload");
