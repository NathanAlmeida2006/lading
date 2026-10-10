/**
 * Injeta o HTML da pagina dentro de dist/index.html.
 *
 * Existe por causa do RNF-L16: a pagina precisa ser legivel ate o fim sem
 * JavaScript. Uma SPA React entrega <div id="raiz"></div> e mais nada, o que
 * reprovaria o requisito e ainda atrasaria o LCP do RNF-L01. Pre-renderizar no
 * build resolve os dois de uma vez, e o cliente so hidrata.
 */
import { readFile, stat, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { validarCondicaoOferta } from "../src/oferta.js";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const molde = join(raiz, "dist", "index.html");

const { config } = await import(pathToFileURL(join(raiz, "src", "config.js")).href);
const { secoes } = await import(pathToFileURL(join(raiz, "src", "secoes.js")).href);
const faltam = [];
const falta = (campo, motivo) => faltam.push(`${campo}: ${motivo}`);
const texto = (valor) => typeof valor === "string" && valor.trim() !== "" && !/\[(?:A DEFINIR|A CONFIRMAR)\]|DEFINIR/i.test(valor);
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

for (const secao of secoes) {
  if (!secao.presente) afirmacao(`secoes.${secao.id}.justificativaAusencia`, texto(secao.justificativaAusencia), "seção omitida sem justificativa de conteúdo");
}
if (config.secoes.amostra.ativo) {
  afirmacao("secoes.amostra.trechoReal", texto(config.secoes.amostra.trechoReal));
  afirmacao("secoes.amostra.origem", texto(config.secoes.amostra.origem));
}

afirmacao("oferta.preco", preco(config.oferta.preco), "preço à vista ausente ou inválido");
afirmacao("oferta.pix.ativo", config.oferta.pix?.ativo === true, "Pix precisa estar disponível");
afirmacao("oferta.pix.valor", preco(config.oferta.pix?.valor), "valor em Pix não confirmado");
if (preco(config.oferta.preco) && preco(config.oferta.pix?.valor)) {
  afirmacao("oferta.pix.valor", valorNumericoPreco(config.oferta.pix.valor) === valorNumericoPreco(config.oferta.preco), "o valor em Pix diverge do preço exibido");
}
if (config.oferta.parcelamento != null) afirmacao("oferta.parcelamento", texto(config.oferta.parcelamento));
afirmacao("oferta.garantiaDias", Number.isInteger(config.oferta.garantiaDias) && config.oferta.garantiaDias > 0, "prazo em dias ausente");
afirmacao("oferta.garantiaCondicoes", texto(config.oferta.garantiaCondicoes), "condições de reembolso ausentes");
afirmacao("oferta.garantiaCanal", texto(config.oferta.garantiaCanal), "canal para pedir reembolso ausente");
afirmacao("entrega.formato", config.entrega.formato === "app", "entrega do app precisa estar declarada");
for (const campo of ["canal", "modoDeAcesso", "prazo"]) afirmacao(`entrega.${campo}`, texto(config.entrega[campo]));

afirmacao("checkout.url", urlHttps(config.checkout.url) && config.checkout.urlConfirmada === true,
  "URL HTTPS real do checkout ainda não confirmada na configuração");
afirmacao("checkout.parametroRastreio", /^[a-zA-Z][\w-]*$/.test(config.checkout.parametroRastreio ?? "") && config.checkout.parametroConfirmado === true,
  "nome do parâmetro de rastreio ainda não confirmado na conta");
afirmacao("pixel.id", /^\d+$/.test(String(config.pixel.id ?? "")), "ID do Pixel ausente");
for (const campo of ["responsavel", "documento"]) afirmacao(`legal.${campo}`, texto(config.legal[campo]));
afirmacao("legal.contato", texto(config.legal.contato) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.legal.contato), "e-mail de contato ausente ou inválido");

const documentoLegal = async (campo) => {
  const valor = config.legal[campo];
  if (!texto(valor)) return falta(`legal.${campo}`, "referência ausente");
  if (urlHttps(valor)) return;
  if (!valor.startsWith("/") || valor.includes("..") || /[?#]/.test(valor)) return falta(`legal.${campo}`, "use URL HTTPS ou arquivo estático publicado");
  const caminho = resolve(raiz, "dist", `.${valor}`);
  try { if (!(await stat(caminho)).isFile()) throw new Error("não é arquivo"); }
  catch { falta(`legal.${campo}`, `documento estático não existe em dist${valor}`); }
};
await Promise.all([documentoLegal("politicaPrivacidade"), documentoLegal("termosDeUso")]);

for (const [indice, bonus] of config.oferta.bonus.entries()) {
  for (const campo of ["id", "nome", "descricao", "origem"]) afirmacao(`oferta.bonus[${indice}].${campo}`, texto(bonus[campo]));
  afirmacao(`oferta.bonus[${indice}].confirmado`, bonus.confirmado === true, "bônus não confirmado");
}
const ancoragem = config.oferta.ancoragem;
if (ancoragem) {
  afirmacao("oferta.ancoragem.precoComparativo", preco(ancoragem.precoComparativo), "preço comparativo ausente ou inválido");
  afirmacao("oferta.ancoragem.fundamento", texto(ancoragem.fundamento));
  afirmacao("oferta.ancoragem.fonte", texto(ancoragem.fonte));
  afirmacao("oferta.ancoragem.confirmado", ancoragem.confirmado === true, "ancoragem comercial não confirmada");
}
for (const [indice, depoimento] of config.depoimentos.entries()) {
  for (const campo of ["id", "texto", "identificacao", "contexto", "origem", "autorizacaoRef"])
    afirmacao(`depoimentos[${indice}].${campo}`, texto(depoimento[campo]));
  afirmacao(`depoimentos[${indice}].aprovado`, depoimento.aprovado === true, "relato ou identificação sem aprovação");
}
const condicao = config.oferta.condicaoOferta;
afirmacao("oferta.disponivel", typeof config.oferta.disponivel === "boolean", "disponibilidade explícita da oferta-base obrigatória");
const validacaoCondicao = validarCondicaoOferta(condicao, {
  checkout: config.checkout,
  referenciaComercial: config.oferta.referenciaComercial,
  agora: Date.now(),
  publicacao: true,
});
for (const erro of validacaoCondicao.erros) falta("oferta.condicaoOferta", erro);

if (faltam.length) {
  const aviso = `prerender  ${faltam.length} pendência(s) de publicação:\n  - ${faltam.join("\n  - ")}`;
  if (process.env.PUBLICAR === "1") {
    console.error(`${aviso}\nPUBLICAR=1: build recusado.`);
    process.exit(1);
  }
  console.warn(`${aviso}\nPreview permitido; PUBLICAR=1 recusará o build.`);
}

const { renderizar } = await import(
  pathToFileURL(join(raiz, "dist-ssr", "entry-server.js")).href
);

const html = await readFile(molde, "utf8");
const marcador = "<!--app-html-->";
if (!html.includes(marcador)) {
  console.error(`prerender  marcador ${marcador} sumiu de index.html`);
  process.exit(1);
}

const pagina = renderizar();
const h1 = (pagina.match(/<h1(?:\s|>)/g) ?? []).length;
if (h1 !== 1) throw new Error(`prerender  esperado um h1; encontrados ${h1}`);
let posicao = -1;
for (const secao of secoes.filter(({ presente }) => presente)) {
  const atual = pagina.indexOf(`id="${secao.id}"`);
  if (atual <= posicao) throw new Error(`prerender  seção ${secao.id} ausente ou fora da ordem RF-L08`);
  posicao = atual;
}
// Função, e não texto: `$&` ou `$$` na copy seriam lidos como padrão de substituição.
let saida = html.replace(marcador, () => pagina);

await writeFile(molde, saida, "utf8");
console.log("prerender  index.html com a pagina dentro; chunks tardios sem modulepreload");
