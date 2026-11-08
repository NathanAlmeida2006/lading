import { useSyncExternalStore } from "react";
import { config } from "./config.js";
import { ler, gravar } from "./armazenamento.js";

const CHAVE_PARAMS = "fluor:params";

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

const semMudanca = () => () => {};
const semParamsNoServidor = () => SEM_PARAMS;

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
  const acrescentar = (chave, valor) => {
    if (!base.searchParams.has(chave)) base.searchParams.append(chave, valor);
  };
  for (const [chave, valor] of Object.entries(permitidos)) acrescentar(chave, valor);
  const origem = permitidos.utm_content ?? permitidos.utm_campaign ?? permitidos.src;
  if (origem && parametroConfirmado === true && typeof parametroRastreio === "string" && parametroRastreio.trim()) {
    acrescentar(parametroRastreio.trim(), origem);
  }
  return base.href;
}

/**
 * Os parametros para o `Botao`, lidos aqui e nao recebidos por prop: nada atravessa a arvore, e so os
 * botoes re-renderizam quando a visita traz campanha. No servidor e na hidratacao, `{}`.
 */
export function criarParametros() {
  let params; // capturados uma vez por carga, no primeiro pedido do navegador

  /** Os parametros da visita; o mesmo `{}` quando nao ha campanha, para ninguem re-renderizar a toa. */
  function lerParametros() {
    if (params === undefined) {
      const capturados = capturarParametros();
      params = Object.keys(capturados).length ? capturados : SEM_PARAMS;
    }
    return params;
  }

  function useParametros() {
    return useSyncExternalStore(semMudanca, lerParametros, semParamsNoServidor);
  }

  return { useParametros };
}
