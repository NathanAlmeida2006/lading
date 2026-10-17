import { useSyncExternalStore } from "react";
import { textoReal as texto } from "./validacao.js";

const absoluto = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})([+-])(\d{2}):(\d{2})$/;

/** Datas de calendário reais, com offset explícito e relógio consistente com o fuso. */
function instanteAbsoluto(valor, fuso) {
  const partes = typeof valor === "string" ? absoluto.exec(valor) : null;
  if (!partes) return NaN;
  const [ano, mes, dia, hora, minuto, segundo] = partes.slice(1, 7).map(Number);
  const bissexto = ano % 4 === 0 && (ano % 100 !== 0 || ano % 400 === 0);
  const dias = [31, bissexto ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (ano < 1 || mes < 1 || mes > 12 || dia < 1 || dia > dias[mes - 1] || hora > 23 || minuto > 59 || segundo > 59 || Number(partes[8]) > 23 || Number(partes[9]) > 59 || /-00:00$/.test(valor)) return NaN;
  const instante = Date.parse(valor);
  if (!Number.isFinite(instante)) return NaN;
  try {
    const local = new Intl.DateTimeFormat("en-GB", {
      timeZone: fuso, year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
    }).formatToParts(instante);
    const campos = Object.fromEntries(local.map(({ type, value }) => [type, value]));
    if (["year", "month", "day", "hour", "minute", "second"].some((campo, indice) => Number(campos[campo]) !== [ano, mes, dia, hora, minuto, segundo][indice])) return NaN;
  } catch { return NaN; }
  return instante;
}

function errosEstrutura(condicao) {
  if (!condicao || typeof condicao !== "object" || Array.isArray(condicao)) return ["condição deve ser um objeto"];
  const erros = [];
  for (const campo of ["texto", "fonte", "fuso", "referenciaComercial", "identificadorCheckout"]) {
    if (!texto(condicao[campo])) erros.push(`${campo}: informação factual ausente ou inválida`);
  }
  if (condicao.confirmado !== true) erros.push("confirmado: aprovação comercial obrigatória");
  for (const campo of ["inicio", "fim", "dataConfirmacao"]) {
    if (!texto(condicao.fuso) || !Number.isFinite(instanteAbsoluto(condicao[campo], condicao.fuso))) erros.push(`${campo}: data absoluta válida com offset consistente com o fuso IANA obrigatória`);
  }
  const inicio = Date.parse(condicao.inicio);
  const fim = Date.parse(condicao.fim);
  if (Number.isFinite(inicio) && Number.isFinite(fim) && fim <= inicio) erros.push("fim: deve ser posterior ao início");
  if (Number.isFinite(fim) && Date.parse(condicao.dataConfirmacao) >= fim) erros.push("dataConfirmacao: confirmação deve anteceder o encerramento");
  return erros;
}

/** Validador único para apresentação e publicação; não concede direito comercial. */
export function validarCondicaoOferta(condicao, { checkout, referenciaComercial, agora, publicacao = false } = {}) {
  if (condicao == null) return { valida: true, condicao: null, erros: [] };
  const erros = errosEstrutura(condicao);
  if (!texto(referenciaComercial) || condicao?.referenciaComercial !== referenciaComercial) erros.push("referenciaComercial: deve corresponder à referência aprovada da oferta");
  if (!texto(checkout?.identificadorOferta) || condicao?.identificadorCheckout !== checkout?.identificadorOferta) erros.push("identificadorCheckout: deve corresponder à oferta configurada na Ticto");
  let checkoutValido = false;
  try { checkoutValido = new URL(checkout?.url).protocol === "https:" && checkout?.urlConfirmada === true; } catch { /* ausência não libera condição */ }
  if (!checkoutValido) erros.push("checkout: URL HTTPS confirmada obrigatória para condição comercial");
  if (publicacao) {
    const instante = converterInstante(agora);
    if (!Number.isFinite(instante)) erros.push("agora: instante da publicação obrigatório");
    else {
      if (Date.parse(condicao?.fim) <= instante) erros.push("fim: condição encerrada; atualizar configuração e reconstruir antes de publicar");
      if (Date.parse(condicao?.dataConfirmacao) > instante) erros.push("dataConfirmacao: confirmação não pode estar no futuro");
    }
  }
  return { valida: erros.length === 0, condicao: erros.length === 0 ? condicao : null, erros };
}

function converterInstante(instante) {
  return instante instanceof Date ? instante.getTime() : typeof instante === "number" ? instante : typeof instante === "string" ? Date.parse(instante) : NaN;
}

/** Início inclusivo e fim exclusivo; sem relógio implícito ou estado de sessão. */
function estadoCondicaoOferta(condicao, instante) {
  const agora = converterInstante(instante);
  if (condicao == null || errosEstrutura(condicao).length || !Number.isFinite(agora)) return "nao-informada";
  if (agora < Date.parse(condicao.inicio)) return "agendada";
  return agora < Date.parse(condicao.fim) ? "vigente" : "encerrada";
}

/** A Ticto decide o acesso comercial; esta regra apenas controla a chamada da landing. */
function ofertaDisponivel(oferta, checkout, instante) {
  if (oferta.disponivel === true) return true;
  const { condicao } = validarCondicaoOferta(oferta.condicaoOferta, { checkout, referenciaComercial: oferta.referenciaComercial });
  return Boolean(condicao) && estadoCondicaoOferta(condicao, instante) === "vigente";
}

const apresentacoes = new WeakMap();
const MAX_TIMEOUT = 2 ** 31 - 1;

function criarApresentacao(oferta, checkout) {
  const { condicao } = validarCondicaoOferta(oferta.condicaoOferta, { checkout, referenciaComercial: oferta.referenciaComercial });
  const assinantes = new Set();
  let estado = "neutra";
  let timer;
  const limparTimer = () => { window.clearTimeout(timer); timer = undefined; };
  function agendar(fronteira) {
    // Prazos longos são segmentados pelo limite da API, sem contagem ou atualização visual.
    const demora = fronteira - Date.now();
    timer = window.setTimeout(() => {
      if (Date.now() < fronteira) agendar(fronteira);
      else sincronizar();
    }, Math.min(MAX_TIMEOUT, Math.max(0, demora)));
  }
  function sincronizar() {
    limparTimer();
    const agora = Date.now();
    const proximo = estadoCondicaoOferta(condicao, agora);
    if (proximo !== estado) {
      estado = proximo;
      assinantes.forEach((assinante) => assinante());
    }
    const fronteira = proximo === "agendada" ? Date.parse(condicao.inicio) : proximo === "vigente" ? Date.parse(condicao.fim) : null;
    if (fronteira !== null) agendar(fronteira);
  }
  function aoRetornar() { if (document.visibilityState !== "hidden") sincronizar(); }
  return {
    condicao,
    verificarDisponibilidade() {
      if (condicao) sincronizar();
      return ofertaDisponivel(oferta, checkout, Date.now());
    },
    snapshot: () => estado,
    subscribe(assinante) {
      assinantes.add(assinante);
      if (assinantes.size === 1 && condicao) {
        document.addEventListener("visibilitychange", aoRetornar);
        window.addEventListener("pageshow", aoRetornar);
        window.addEventListener("focus", aoRetornar);
        sincronizar();
      }
      return () => {
        assinantes.delete(assinante);
        if (assinantes.size === 0 && condicao) {
          limparTimer();
          document.removeEventListener("visibilitychange", aoRetornar);
          window.removeEventListener("pageshow", aoRetornar);
          window.removeEventListener("focus", aoRetornar);
        }
      };
    },
  };
}

const snapshotServidor = () => "neutra";

/** Um relógio de apresentação compartilhado por todos os CTAs; SSR determinístico. */
export function useCondicaoOferta(oferta, checkout) {
  let porCheckout = apresentacoes.get(oferta);
  if (!porCheckout) { porCheckout = new WeakMap(); apresentacoes.set(oferta, porCheckout); }
  let apresentacao = porCheckout.get(checkout);
  if (!apresentacao) { apresentacao = criarApresentacao(oferta, checkout); porCheckout.set(checkout, apresentacao); }
  const estado = useSyncExternalStore(apresentacao.subscribe, apresentacao.snapshot, snapshotServidor);
  return { condicao: apresentacao.condicao, estado, disponivel: oferta.disponivel === true || (Boolean(apresentacao.condicao) && estado === "vigente"), verificarDisponibilidade: apresentacao.verificarDisponibilidade };
}
