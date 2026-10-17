/**
 * Instrumentacao: parametros, consentimento, pixel e alcance das secoes.
 *
 * Regra que organiza o arquivo inteiro (RF-L29): a landing reporta INTENCAO,
 * a Ticto reporta o FATO. `Purchase` nao nasce aqui. Pixel que dispara compra
 * no clique conta venda que pode nao ter acontecido, e o ledger passa a
 * registrar receita que o extrato desmente.
 *
 * O estado de mensuracao mora neste modulo, e nao em componente: sobrevive ao
 * StrictMode e a remontagem, e a pagina tem um dono so para "ja enviei isto?".
 */
import { useSyncExternalStore } from "react";
import { config } from "./config.js";

const CHAVE_PARAMS = "fluor:params";
const CHAVE_CONSENTIMENTO = "fluor:consentimento";

// Lista permitida: so estas chaves sao lidas da URL e repassadas ao checkout.
const RASTREIO = [
  "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term",
  "fbclid", "src", "sck",
];
const VALOR_PERMITIDO = /^[\w.~:+%-]{1,100}$/;

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

const SEM_PARAMS = {};
let params; // capturados uma vez por carga, no primeiro pedido do navegador

/** Os parametros da visita; o mesmo `{}` quando nao ha campanha, para ninguem re-renderizar a toa. */
function lerParametros() {
  if (params === undefined) {
    const capturados = capturarParametros();
    params = Object.keys(capturados).length ? capturados : SEM_PARAMS;
  }
  return params;
}

const semMudanca = () => () => {};
const semParamsNoServidor = () => SEM_PARAMS;

/**
 * Os parametros para o `Botao`, lidos aqui e nao recebidos por prop: nada atravessa a arvore, e so os
 * botoes re-renderizam quando a visita traz campanha. No servidor e na hidratacao, `{}`.
 */
export function useParametros() {
  return useSyncExternalStore(semMudanca, lerParametros, semParamsNoServidor);
}

/**
 * Monta a URL do checkout com a origem preservada (RF-L26). A URL-base de
 * `config.checkout.url` sai como esta (origin, pathname e query): so se
 * ACRESCENTA, e chave que a base ja traz nao e sobrescrita. Sem URL confirmada
 * o href fica intacto.
 *
 * Limitacao: em build estatico sem JavaScript o link do checkout funciona e
 * aponta para a URL-base, mas as UTMs da visita nao sao repassadas, porque a
 * leitura e o repasse ocorrem no navegador.
 */
export function urlCheckout(params = {}) {
  const { url, urlConfirmada, parametroRastreio, parametroConfirmado } = config.checkout;
  if (urlConfirmada !== true) return url;
  let base;
  try {
    base = new URL(url);
  } catch {
    return url;
  }
  const permitidos = {};
  for (const chave of RASTREIO) {
    const valor = params?.[chave];
    if (typeof valor === "string" && VALOR_PERMITIDO.test(valor)) permitidos[chave] = valor;
  }
  const extras = new URLSearchParams();
  const acrescentar = (chave, valor) => {
    if (!base.searchParams.has(chave) && !extras.has(chave)) extras.set(chave, valor);
  };
  for (const [chave, valor] of Object.entries(permitidos)) acrescentar(chave, valor);
  const origem = permitidos.utm_content ?? permitidos.utm_campaign ?? permitidos.src;
  if (origem && parametroConfirmado === true && typeof parametroRastreio === "string" && parametroRastreio.trim()) {
    acrescentar(parametroRastreio.trim(), origem);
  }
  const sufixo = extras.toString();
  if (!sufixo) return url;
  const corte = url.indexOf("#");
  const semHash = corte < 0 ? url : url.slice(0, corte);
  const juncao = !semHash.includes("?") ? "?" : /[?&]$/.test(semHash) ? "" : "&";
  return semHash + juncao + sufixo + (corte < 0 ? "" : url.slice(corte));
}

/* -------------------------------------------------------------------------
   Consentimento
   ------------------------------------------------------------------------- */

let consentimento; // undefined = ainda nao lido; depois true | false | null (sem resposta)
const assinantes = new Set();

/** true | false | null. Valor estavel entre chamadas: serve de snapshot a `useSyncExternalStore`. */
export function lerConsentimento() {
  if (consentimento === undefined && typeof window !== "undefined") {
    const guardado = ler(CHAVE_CONSENTIMENTO);
    consentimento = typeof guardado === "boolean" ? guardado : null;
  }
  return consentimento ?? null;
}

/** Avisa quando o visitante responde. Devolve o cancelamento. */
export function assinarConsentimento(assinante) {
  assinantes.add(assinante);
  return () => assinantes.delete(assinante);
}

// No servidor e na hidratacao vale "sem aviso e sem doca": a resposta real so se le no navegador.
const respostaNoServidor = () => false;

/** A resposta (true | false | null) para os componentes: o aviso e a doca leem daqui. */
export function useConsentimento() {
  return useSyncExternalStore(assinarConsentimento, lerConsentimento, respostaNoServidor);
}

/** A unica porta de entrada da resposta: grava, e quem assina (aviso, doca, alcance) reage. */
export function responderConsentimento(aceitou) {
  consentimento = aceitou === true;
  gravar(CHAVE_CONSENTIMENTO, consentimento);
  for (const assinante of [...assinantes]) {
    try { assinante(); } catch (erro) { console.error(erro); }
  }
}

/* -------------------------------------------------------------------------
   Pixel
   ------------------------------------------------------------------------- */

let pixelInjetado = false; // o script que ESTE modulo pos na pagina; `window.fbq` alheio nao conta
let pixelFalhou = false; // o script nao carregou (bloqueado): o stub enfileiraria para sempre, sem enviar
let paginaVista = false;
const enviadas = new Set(); // impressoes de secao ja enviadas nesta carga de pagina

const idDoPixel = () => String(config.pixel.id ?? "").trim();

/**
 * A guarda unica (RNF-L23). Carregar o pixel exige aceite e id; enviar exige, alem disso, o
 * script injetado por este modulo. Nada de terceiro acontece fora dela.
 */
function elegivel(paraEnvio = true) {
  if (typeof window === "undefined" || lerConsentimento() !== true || !idDoPixel()) return false;
  return !paraEnvio || (pixelInjetado && !pixelFalhou && typeof window.fbq === "function");
}

/** Idempotente: um script, um `init` e um PageView por carga de pagina. */
function carregarPixel() {
  if (!elegivel(false)) return;
  if (!pixelInjetado) {
    if (window.fbq) return; // pixel de outra origem: este modulo nao assume o que nao carregou
    try {
      const fbq = function () {
        fbq.callMethod ? fbq.callMethod.apply(fbq, arguments) : fbq.queue.push(arguments);
      };
      fbq.push = fbq; fbq.loaded = true; fbq.version = "2.0"; fbq.queue = [];
      window.fbq = fbq;
      window._fbq ??= fbq;
      const script = document.createElement("script");
      script.async = true;
      script.src = "https://connect.facebook.net/en_US/fbevents.js";
      script.onerror = () => { pixelFalhou = true; };
      document.head.appendChild(script);
      pixelInjetado = true;
      fbq("init", idDoPixel());
    } catch {
      return;
    }
  }
  if (!paginaVista) paginaVista = evento("PageView");
}

// Tudo o que a pagina sabe enviar (RF-L28). Nome fora desta lista nao sai: `Purchase` nao tem como nascer aqui.
const EVENTOS = {
  PageView: "track",
  ViewContent: "track",
  InitiateCheckout: "track",
  SecaoAlcancada: "trackCustom",
};

/** Devolve se o evento saiu. Erro do tracker morre aqui: nunca chega a quem chamou. */
function evento(nome, dados) {
  try {
    if (!EVENTOS[nome] || !elegivel()) return false;
    if (dados) window.fbq(EVENTOS[nome], nome, dados);
    else window.fbq(EVENTOS[nome], nome);
    return true;
  } catch {
    return false;
  }
}

/**
 * Intencao de compra no clique de um CTA: cada clique legitimo e um evento, sem deduplicar.
 * Sincrono e sem retorno: o clique nao espera nada daqui. Com checkout nao confirmado (o link
 * ainda e a ancora do preview) nao ha intencao a registrar.
 */
export function registrarInicioCheckout(posicaoCTA) {
  if (config.checkout.urlConfirmada !== true) return;
  evento("InitiateCheckout", { posicaoCTA, campanha: config.campanha });
}

/* -------------------------------------------------------------------------
   Alcance das secoes
   ------------------------------------------------------------------------- */

/**
 * Liga a mensuracao da pagina e devolve o desligamento. `alcance` e o mapa de secoes.js
 * (id -> { etapa, canonico }); RF-L31 le as canonicas, e a oferta vira `ViewContent`:
 * alcanca-la e o unico ponto da pagina que significa interesse pelo produto.
 *
 * Antes do aceite nao existe observador: nada e marcado nem desobservado. No aceite ele e
 * criado, e a primeira entrega do IntersectionObserver e o estado DAQUELE instante: so conta
 * o que esta na tela. O que ja passou nao e retransmitido, e volta a contar se for revisitado.
 * A impressao so entra em `enviadas` depois de o evento ter saido de fato.
 */
export function iniciarMensuracao(alcance = {}) {
  if (typeof window === "undefined") return () => {};
  let observador;

  function sincronizar() {
    observador?.disconnect();
    observador = undefined;
    carregarPixel();
    if (!elegivel() || !("IntersectionObserver" in window)) return;
    observador = new IntersectionObserver(
      (entradas) => {
        for (const { isIntersecting, target } of entradas) {
          const id = target.id;
          if (!isIntersecting || enviadas.has(id) || !alcance[id]) continue;
          const { etapa, canonico } = alcance[id];
          const base = { secao: id, etapa };
          const saiu = id === "oferta"
            ? evento("ViewContent", { ...base, campanha: config.campanha })
            : evento("SecaoAlcancada", { ...base, canonico, campanha: config.campanha });
          if (!saiu) continue;
          enviadas.add(id);
          observador?.unobserve(target);
        }
      },
      // 40% DA JANELA, e nao 40% da secao: a prova tem 2500 a 3100 px, nunca mostra 40% de si de
      // uma vez, e o evento dela nao disparava. A secao conta como alcancada quando o topo dela
      // cruza a marca de 60% da altura da tela, que e o que 40% significava numa secao de uma tela.
      // O 1px tirado do alto descarta o toque de borda: com a secao seguinte exatamente no topo da tela,
      // a anterior encosta em y=0 sem mostrar nada, e o observador a daria como presente no aceite tardio.
      { rootMargin: "-1px 0px -40% 0px", threshold: 0 },
    );
    for (const id of Object.keys(alcance)) {
      const alvo = enviadas.has(id) ? null : document.getElementById(id);
      if (alvo) observador.observe(alvo);
    }
  }

  const cancelar = assinarConsentimento(sincronizar);
  sincronizar();
  return () => {
    cancelar();
    observador?.disconnect();
    observador = undefined;
  };
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
