/**
 * Instrumentacao: parametros, pixel e profundidade de rolagem.
 *
 * Regra que organiza o arquivo inteiro (RF-L29): a landing reporta INTENCAO,
 * a Ticto reporta o FATO. `Purchase` nao nasce aqui. Pixel que dispara compra
 * no clique conta venda que pode nao ter acontecido, e o ledger passa a
 * registrar receita que o extrato desmente.
 */
import { config } from "./config.js";

const CHAVE_PARAMS = "fluor:params";
const CHAVE_CONSENTIMENTO = "fluor:consentimento";

const RASTREIO = [
  "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term",
  "fbclid", "src", "sck",
];

/* -------------------------------------------------------------------------
   Parametros de campanha
   ------------------------------------------------------------------------- */

/**
 * Le a URL uma vez e guarda o que veio (RF-L30). A gravacao e necessaria
 * porque a rolagem por ancora reescreve o hash, e um `history.replaceState`
 * de terceiro pode levar a query junto.
 */
export function capturarParametros() {
  if (typeof window === "undefined") return {};
  const daUrl = {};
  const busca = new URLSearchParams(window.location.search);
  for (const chave of RASTREIO) {
    const valor = busca.get(chave);
    if (valor) daUrl[chave] = valor;
  }
  const guardados = ler(CHAVE_PARAMS) ?? {};
  const juntos = { ...guardados, ...daUrl };
  if (Object.keys(daUrl).length) gravar(CHAVE_PARAMS, juntos);
  return juntos;
}

/**
 * Monta a URL do checkout com a origem preservada (RF-L26).
 * Sem isso a venda chega na Ticto sem dizer de qual criativo veio, e o ledger
 * registra resultado sem causa.
 */
export function urlCheckout(params = {}) {
  const { url, parametroRastreio } = config.checkout;
  let destino;
  try {
    destino = new URL(url);
  } catch {
    return url;
  }
  for (const [chave, valor] of Object.entries(params)) {
    destino.searchParams.set(chave, valor);
  }
  const origem = params.utm_content ?? params.utm_campaign ?? params.src;
  if (origem && parametroRastreio) {
    destino.searchParams.set(parametroRastreio, origem);
  }
  return destino.toString();
}

/* -------------------------------------------------------------------------
   Consentimento e pixel
   ------------------------------------------------------------------------- */

export function lerConsentimento() {
  return ler(CHAVE_CONSENTIMENTO);
}

export function gravarConsentimento(aceitou) {
  gravar(CHAVE_CONSENTIMENTO, aceitou);
}

/**
 * Carrega o pixel do Meta. So depois do aceite (RNF-L23): evento de terceiro
 * antes do consentimento e o que a LGPD nao permite.
 */
export function carregarPixel() {
  if (typeof window === "undefined" || !config.pixel.id) return;
  if (window.fbq) return;

  !(function (f, b, e, v, n, t, s) {
    if (f.fbq) return; n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = [];
    t = b.createElement(e); t.async = !0; t.src = v;
    s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
  })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");

  window.fbq("init", config.pixel.id);
  evento("PageView");
}

// Os unicos eventos PADRAO do Meta que a pagina dispara. Qualquer outro nome e evento
// personalizado, e o Meta so o aceita por `trackCustom`.
const PADRAO = new Set(["PageView", "ViewContent", "InitiateCheckout"]);

/** Evento nomeado (RF-L28). Sem pixel carregado, no-op silencioso. */
export function evento(nome, dados) {
  if (typeof window === "undefined" || !window.fbq) return;
  window.fbq(PADRAO.has(nome) ? "track" : "trackCustom", nome, dados);
}

/* -------------------------------------------------------------------------
   Profundidade de rolagem
   ------------------------------------------------------------------------- */

/**
 * Marca o alcance das secoes 4 (prova), 6 (oferta) e 9 (fechamento) — RF-L31.
 * E o dado que diz ONDE a pagina perde o visitante. Sem ele o ledger registra
 * resultado sem causa, e o proximo ciclo testa no escuro.
 *
 * `ViewContent` sai na oferta, nao na carga: alcancar a oferta e o unico
 * ponto da pagina que significa interesse pelo produto.
 */
export function observarProfundidade() {
  if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
    return () => {};
  }
  const vistas = new Set();
  const observador = new IntersectionObserver(
    (entradas) => {
      for (const entrada of entradas) {
        if (!entrada.isIntersecting) continue;
        const id = entrada.target.id;
        if (vistas.has(id)) continue;
        vistas.add(id);
        evento(id === "oferta" ? "ViewContent" : "SecaoAlcancada", { secao: id });
        observador.unobserve(entrada.target);
      }
    },
    // 40% DA JANELA, e nao 40% da secao: a prova tem 2500 a 3100 px, nunca mostra 40% de si de
    // uma vez, e o evento dela nao disparava. A secao conta como alcancada quando o topo dela
    // cruza a marca de 60% da altura da tela, que e o que 40% significava numa secao de uma tela.
    { rootMargin: "0px 0px -40% 0px", threshold: 0 },
  );
  for (const id of ["prova", "oferta", "fechamento"]) {
    const alvo = document.getElementById(id);
    if (alvo) observador.observe(alvo);
  }
  return () => observador.disconnect();
}

/* -------------------------------------------------------------------------
   sessionStorage tolerante
   ------------------------------------------------------------------------- */

function ler(chave) {
  try {
    const bruto = window.sessionStorage.getItem(chave);
    return bruto ? JSON.parse(bruto) : null;
  } catch {
    return null;
  }
}

function gravar(chave, valor) {
  try {
    window.sessionStorage.setItem(chave, JSON.stringify(valor));
  } catch {
    /* navegacao anonima ou storage bloqueado: a pagina segue funcionando */
  }
}
