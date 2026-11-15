import { useEffect, useRef, useState } from "react";
import { padTwoDigits } from "../../app/ui.js";
import { getValidPromotionEnd, readLocalValue, writeLocalValue } from "../../infra/storage.js";

/**
 * Os cronometros da promocao: o `Countdown` (hh:mm:ss, no recibo das duas pilhas e na doca) e a
 * `LimitedOffer` (com os milesimos correndo, abaixo do recibo).
 *
 * Um relogio so para todos. Antes cada instancia tinha o proprio laco de `requestAnimationFrame`,
 * eterno: cinco lacos, e com qualquer laco ativo o Chrome reavalia o estilo das animacoes CSS a cada
 * quadro, a pagina inteira (medido em 02/10 e em 17/10/2026). Agora:
 *   - com alguma `LimitedOffer` a ate uma tela da janela, um rAF por quadro, porque os milesimos
 *     estao a vista (ou quase) e correm a cada quadro, como antes;
 *   - fora disso, so na virada de cada segundo (o `Countdown` so muda ai), acordando um pouco antes
 *     e assentando no primeiro quadro depois da virada: o digito vira no mesmo quadro de antes.
 * Todos leem o mesmo instante, entao os segundos do recibo e os da oferta viram juntos. Com a aba
 * oculta nada roda (como o rAF), e na volta o valor se atualiza na hora.
 */
const DURATION = 24 * 60 * 60 * 1000;
const STORAGE_KEY = "promocao-fim";
// Quanto antes da virada do segundo o relogio acorda para assentar no primeiro quadro depois dela.
const LEAD_TIME = 30;

/** Fim da promocao: 24 h a partir da primeira visita, guardado para o recarregar nao reiniciar. */
/**
 * @returns {number} Instante do fim da promocao, em ms.
 */
function getPromotionEnd() {
  const now = Date.now();
  const saved = getValidPromotionEnd(readLocalValue(STORAGE_KEY), now, DURATION);
  if (saved !== null) return saved;
  const end = now + DURATION;
  writeLocalValue(STORAGE_KEY, end); // sem storage o relogio reinicia a cada visita
  return end;
}

let end; // lido uma vez por carga: sem storage, os cinco cronometros ainda contam o mesmo fim
const listeners = new Set();
let nearCount = 0; // quantas `LimitedOffer` estao a ate uma tela da janela
let frame = 0;
let timer = 0;

function stop() {
  cancelAnimationFrame(frame);
  clearTimeout(timer);
  frame = 0;
  timer = 0;
}

function tick() {
  frame = 0;
  const remaining = Math.max(0, end - Date.now());
  for (const listener of listeners) listener(remaining);
  // Zerado nada mais muda; com a aba oculta o rAF tambem nao rodaria.
  if (!listeners.size || remaining <= 0 || document.hidden) return;
  const rest = remaining % 1000 || 1000;
  if (nearCount > 0 || rest <= LEAD_TIME) frame = requestAnimationFrame(tick);
  else timer = setTimeout(() => { timer = 0; frame = requestAnimationFrame(tick); }, rest - LEAD_TIME);
}

/** Entrega o restante de agora a todos e reagenda: na assinatura, na volta da aba e na troca de ritmo. */
function reschedule() {
  stop();
  if (listeners.size) tick();
}

/**
 * Assina o relogio compartilhado; a funcao devolvida cancela a assinatura.
 * @param {(remaining: number) => void} listener - Recebe o restante em ms a cada tique.
 * @returns {() => void} Cancela a assinatura.
 */
function subscribe(listener) {
  end ??= getPromotionEnd();
  listeners.add(listener);
  if (listeners.size === 1) document.addEventListener("visibilitychange", reschedule);
  reschedule();
  return () => {
    listeners.delete(listener);
    if (listeners.size) return;
    document.removeEventListener("visibilitychange", reschedule);
    stop();
  };
}

/** Marca a `LimitedOffer` como perto da tela enquanto ela estiver a ate uma tela da janela. */
/**
 * Marca a oferta como perto da tela enquanto ela estiver a ate uma tela da janela.
 * @param {Element} element - Elemento observado.
 * @returns {(() => void)|undefined} Desliga o observador.
 */
function watch(element) {
  if (!element) return undefined;
  let isInside = false;
  const updateInside = (isIntersecting) => {
    if (isIntersecting === isInside) return;
    isInside = isIntersecting;
    nearCount += isIntersecting ? 1 : -1;
    reschedule();
  };
  const observer = new IntersectionObserver(([entry]) => updateInside(entry.isIntersecting), { rootMargin: "100% 0px" });
  observer.observe(element);
  return () => {
    observer.disconnect();
    updateInside(false);
  };
}

/** Restante em ms; `DURACAO` no servidor e na hidratacao, o valor real logo depois. */
/**
 * @returns {number} Restante em ms, arredondado para cima ao segundo.
 */
function useRemaining() {
  const [remaining, setRemaining] = useState(DURATION);
  useEffect(
    // Arredonda para cima ao segundo: o estado so muda a cada segundo.
    () => subscribe((ms) => setRemaining(Math.ceil(ms / 1000) * 1000)),
    [],
  );
  return remaining;
}

/** Contagem regressiva de 24 h; zerada, mostra o aviso de expiracao. Renderiza "24:00:00" no servidor. */
/**
 * @param {object} props
 * @param {string} [props.className="text-body text-center"] - Classes do paragrafo.
 * @returns {JSX.Element}
 */
export function Countdown({ className = "text-body text-center" }) {
  const remaining = useRemaining();

  if (remaining <= 0) {
    return <p className="font-secundaria text-body uppercase text-center text-acento" role="status">PROMOÇÃO IRÁ EXPIRAR LOGO</p>;
  }
  const totalSeconds = Math.ceil(remaining / 1000);
  return (
    <p className={`font-terciaria ${className} text-bone tabular-nums`}>
      <span className="font-secundaria text-overline uppercase text-silver">a promoção acaba em </span>
      <time className="font-bold text-acento">{padTwoDigits(Math.floor(totalSeconds / 3600))}:{padTwoDigits(Math.floor(totalSeconds / 60) % 60)}:{padTwoDigits(totalSeconds % 60)}</time>
    </p>
  );
}

/**
 * @param {number} remaining - Restante em ms.
 * @returns {string} Ex.: "0d 23h 59min 59s 999ms".
 */
const formatWithMillis = (remaining) => {
  const totalSeconds = Math.ceil(remaining / 1000);
  return `${Math.floor(totalSeconds / 86400)}d ${Math.floor(totalSeconds / 3600) % 24}h ${Math.floor(totalSeconds / 60) % 60}min ${padTwoDigits(totalSeconds % 60)}s ${String(remaining % 1000).padStart(3, "0")}ms`;
};
/** Oferta limitada: mesmo fim do `Countdown`, em "0d 23h 59min 59s 999ms" com os milesimos correndo. */
/**
 * @returns {JSX.Element|null} Nulo depois que a promocao acaba.
 */
export function LimitedOffer() {
  const root = useRef(null);
  const text = useRef(null);
  const [isActive, setIsActive] = useState(true);
  useEffect(() => subscribe((ms) => {
    if (ms <= 0) setIsActive(false);
    else if (text.current) text.current.firstChild.nodeValue = formatWithMillis(ms);
  }), []);
  useEffect(() => (isActive ? watch(root.current) : undefined), [isActive]);
  if (!isActive) return null;
  return (
    <div className="mt-10 text-center" ref={root}>
      <p className="font-secundaria font-extrabold uppercase leading-none whitespace-nowrap text-acento text-[length:clamp(28px,9vw,56px)]">
        Oferta limitada
      </p>
      <p ref={text} className="mt-3 font-terciaria font-bold text-bone-pure tabular-nums text-[length:clamp(18px,5.5vw,30px)]" aria-hidden="true">
        {formatWithMillis(DURATION)}
      </p>
    </div>
  );
}
