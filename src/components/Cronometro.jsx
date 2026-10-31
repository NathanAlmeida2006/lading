import { useEffect, useRef, useState } from "react";
import { doisDigitos } from "../ui.js";

/**
 * Os cronometros da promocao: o `Cronometro` (hh:mm:ss, no recibo das duas pilhas e na doca) e a
 * `OfertaLimitada` (com os milesimos correndo, abaixo do recibo).
 *
 * Um relogio so para todos. Antes cada instancia tinha o proprio laco de `requestAnimationFrame`,
 * eterno: cinco lacos, e com qualquer laco ativo o Chrome reavalia o estilo das animacoes CSS a cada
 * quadro, a pagina inteira (medido em 02/10 e em 17/10/2026). Agora:
 *   - com alguma `OfertaLimitada` a ate uma tela da janela, um rAF por quadro, porque os milesimos
 *     estao a vista (ou quase) e correm a cada quadro, como antes;
 *   - fora disso, so na virada de cada segundo (o `Cronometro` so muda ai), acordando um pouco antes
 *     e assentando no primeiro quadro depois da virada: o digito vira no mesmo quadro de antes.
 * Todos leem o mesmo instante, entao os segundos do recibo e os da oferta viram juntos. Com a aba
 * oculta nada roda (como o rAF), e na volta o valor se atualiza na hora.
 */
const DURACAO = 24 * 60 * 60 * 1000;
const CHAVE = "promocao-fim";
// Quanto antes da virada do segundo o relogio acorda para assentar no primeiro quadro depois dela.
const ANTECEDENCIA = 30;

/** Fim da promocao: 24 h a partir da primeira visita, guardado para o recarregar nao reiniciar. */
function fimDaPromocao() {
  try {
    const salvo = Number(localStorage.getItem(CHAVE));
    if (salvo > 0) return salvo;
    const fim = Date.now() + DURACAO;
    localStorage.setItem(CHAVE, String(fim));
    return fim;
  } catch {
    return Date.now() + DURACAO; // ponytail: sem storage o relogio reinicia a cada visita
  }
}

let fim; // lido uma vez por carga: sem storage, os cinco cronometros ainda contam o mesmo fim
const ouvintes = new Set();
let perto = 0; // quantas `OfertaLimitada` estao a ate uma tela da janela
let quadro = 0;
let timer = 0;

function parar() {
  cancelAnimationFrame(quadro);
  clearTimeout(timer);
  quadro = 0;
  timer = 0;
}

function tique() {
  quadro = 0;
  const restante = Math.max(0, fim - Date.now());
  for (const ouvir of ouvintes) ouvir(restante);
  // Zerado nada mais muda; com a aba oculta o rAF tambem nao rodaria.
  if (!ouvintes.size || restante <= 0 || document.hidden) return;
  const resto = restante % 1000 || 1000;
  if (perto > 0 || resto <= ANTECEDENCIA) quadro = requestAnimationFrame(tique);
  else timer = setTimeout(() => { timer = 0; quadro = requestAnimationFrame(tique); }, resto - ANTECEDENCIA);
}

/** Entrega o restante de agora a todos e reagenda: na assinatura, na volta da aba e na troca de ritmo. */
function reagendar() {
  parar();
  if (ouvintes.size) tique();
}

function assinar(ouvir) {
  fim ??= fimDaPromocao();
  ouvintes.add(ouvir);
  if (ouvintes.size === 1) document.addEventListener("visibilitychange", reagendar);
  reagendar();
  return () => {
    ouvintes.delete(ouvir);
    if (ouvintes.size) return;
    document.removeEventListener("visibilitychange", reagendar);
    parar();
  };
}

/** Marca a `OfertaLimitada` como perto da tela enquanto ela estiver a ate uma tela da janela. */
function vigiar(elemento) {
  if (!elemento) return undefined;
  let dentro = false;
  const mudar = (agora) => {
    if (agora === dentro) return;
    dentro = agora;
    perto += agora ? 1 : -1;
    reagendar();
  };
  const observador = new IntersectionObserver(([e]) => mudar(e.isIntersecting), { rootMargin: "100% 0px" });
  observador.observe(elemento);
  return () => {
    observador.disconnect();
    mudar(false);
  };
}

/** Restante em ms; `DURACAO` no servidor e na hidratacao, o valor real logo depois. */
function useRestante() {
  const [restante, definirRestante] = useState(DURACAO);
  useEffect(
    // Arredonda para cima ao segundo: o estado so muda a cada segundo.
    () => assinar((ms) => definirRestante(Math.ceil(ms / 1000) * 1000)),
    [],
  );
  return restante;
}

/** Contagem regressiva de 24 h; zerada, mostra o aviso de expiracao. Renderiza "24:00:00" no servidor. */
export function Cronometro({ classe = "text-body text-center" }) {
  const restante = useRestante();

  if (restante <= 0) {
    return <p className="font-secundaria text-body uppercase text-center text-acento" role="status">PROMOÇÃO IRÁ EXPIRAR LOGO</p>;
  }
  const t = Math.ceil(restante / 1000);
  return (
    <p className={`font-terciaria ${classe} text-bone tabular-nums`}>
      <span className="font-secundaria text-overline uppercase text-silver">a promoção acaba em </span>
      <time className="font-bold text-acento">{doisDigitos(Math.floor(t / 3600))}:{doisDigitos(Math.floor(t / 60) % 60)}:{doisDigitos(t % 60)}</time>
    </p>
  );
}

const milesimos = (restante) => {
  const t = Math.ceil(restante / 1000);
  return `${Math.floor(t / 86400)}d ${Math.floor(t / 3600) % 24}h ${Math.floor(t / 60) % 60}min ${doisDigitos(t % 60)}s ${String(restante % 1000).padStart(3, "0")}ms`;
};
/** Oferta limitada: mesmo fim do `Cronometro`, em "0d 23h 59min 59s 999ms" com os milesimos correndo. */
export function OfertaLimitada() {
  const raiz = useRef(null);
  const texto = useRef(null);
  const [ativa, definirAtiva] = useState(true);
  useEffect(() => assinar((ms) => {
    if (ms <= 0) definirAtiva(false);
    else if (texto.current) texto.current.firstChild.nodeValue = milesimos(ms);
  }), []);
  useEffect(() => (ativa ? vigiar(raiz.current) : undefined), [ativa]);
  if (!ativa) return null;
  return (
    <div className="mt-10 text-center" ref={raiz}>
      <p className="font-secundaria font-extrabold uppercase leading-none whitespace-nowrap text-acento text-[length:clamp(28px,9vw,56px)]">
        Oferta limitada
      </p>
      <p ref={texto} className="mt-3 font-terciaria font-bold text-bone-pure tabular-nums text-[length:clamp(18px,5.5vw,30px)]" aria-hidden="true">
        {milesimos(DURACAO)}
      </p>
    </div>
  );
}
