import { useLayoutEffect, useRef } from "react";
import { isMotionReduced } from "../../sensory/tokens.js";
import { getTopWithin } from "../../sensory/ruler.js";

/**
 * Rola a tela do app do topo até `to`, em duração fixa.
 * @param {{current: HTMLElement|null}} scroller - Ref da área rolável.
 * @param {object} options - Trecho `to`, duração, `onMeasure` e `startAt`.
 * @returns {void}
 */
function useScrolling(scroller, { to, duration, onMeasure, startAt }) {
  useLayoutEffect(() => {
    const node = scroller.current;
    const reduced = isMotionReduced();
    const items = node.querySelectorAll("[data-revelar]");
    const getPosition = ({ target, y }) => getTopWithin(node.querySelector(target), node) - y;
    node.scrollTop = 0;
    const obs = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && e.target.setAttribute("data-visto", "")),
      { root: node, rootMargin: "0px 0px -8% 0px" },
    );
    items.forEach((i) => obs.observe(i));
    if (reduced) {
      items.forEach((i) => i.setAttribute("data-visto", ""));
      return () => obs.disconnect();
    }

    const max = node.scrollHeight - node.clientHeight;
    const end = Math.min(max, getPosition(to));
    const pace = Math.max(0, end) / (duration / 1000);
    onMeasure?.(pace);
    let frame = 0;
    let alive = true;
    let t0 = startAt ?? null;
    let y = 0;
    const walk = (now) => {
      y = Math.min(end, (Math.max(0, now - t0) / 1000) * pace);
      node.scrollTop = y;
    };
    // Com `startAt`, o primeiro quadro já sai no lugar em que a tela devia estar nesta hora.
    if (t0 != null) walk(performance.now());
    // O que já está na tela entra pronto, sem o fade de 600 ms do `data-revelar` (que nasce em opacity 0 e só liberaria no 1o callback do
    // IntersectionObserver, um ou dois quadros depois): num corte de vídeo isso era a tela quase vazia, que enchia aos poucos.
    const box = node.getBoundingClientRect();
    const onScreen = [...items].filter((i) => {
      const r = i.getBoundingClientRect();
      return r.bottom > box.top && r.top < box.bottom - box.height * 0.08;
    });
    onScreen.forEach((i) => {
      i.style.transition = "none";
      i.setAttribute("data-visto", "");
    });
    void node.offsetWidth; // consolida o estilo sem transição; só depois ela volta
    onScreen.forEach((i) => i.style.removeProperty("transition"));
    const step = (now) => {
      if (!alive) return;
      t0 ??= now;
      walk(now);
      if (y < end) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => {
      alive = false;
      cancelAnimationFrame(frame);
      obs.disconnect();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- intencional: to, duration, onMeasure e startAt são lidos uma vez na montagem; rodar de novo reiniciaria a rolagem; rolo é ref estável
}

/**
 * Uma tela do app Lithium, rolada por um usuário: a moldura de celular (430 px no desktop, a tela toda no celular)
 * e a rolagem rápida e de velocidade constante, que já começa andando (sem espera). `scope` é a classe a que o CSS
 * da tela está restrito (styles/app-screens.css, por prefixo de seletor). Os `data-revelar` entram pela rolagem, como no app.
 *
 * A tela rola só um trecho, definido pelo que aparece nela: `to` { target, y } rola do topo até o `target` (seletor) chegar
 * a `y` px do topo da tela, em exatamente `duration` ms (a velocidade sai da distância, e vai para `onMeasure`, em px/s).
 * Quem tira a tela de cena é o vídeo (Video.jsx), na hora da batida. Sob movimento reduzido não rola: fica no topo.
 *
 * `startAt` (ms, no relógio de `performance.now()`): a hora em que o estágio devia entrar. A rolagem com `to` conta dele, e não do primeiro
 * quadro depois de montar: se o React monta tarde (celular, CPU carregada), a tela chega ao alvo na hora do corte seguinte, e
 * não depois dele. Sem `startAt`, conta do primeiro quadro.
 *
 * Um dedo (toque translúcido) arrasta para cima sobre a tela, em loop, enquanto ela rola.
 *
 * @param {object} props
 * @param {string} props.scope - Classe a que o CSS da tela está restrito (prefixo de seletor).
 * @param {ReactNode} props.children - Conteúdo da tela.
 * @param {{target: string, y: number}} props.to - Trecho da rolagem: do topo até `target` chegar a `y` px.
 * @param {number} [props.duration=1200] - Tempo da rolagem, em ms.
 * @param {(speed: number) => void} [props.onMeasure] - Recebe a velocidade calculada.
 * @param {number} [props.startAt] - Hora em que o estágio devia entrar.
 * @returns {JSX.Element} A moldura de celular, com a tela rolando.
 */
export function AppScreen({ scope, children, to, duration = 1200, onMeasure, startAt }) {
  const scroller = useRef(null);
  useScrolling(scroller, { to, duration, onMeasure, startAt });

  return (
    <div
      className={`${scope} absolute inset-0 z-4 flex justify-center bg-void`}
      aria-hidden="true"
      inert
    >
      <div className="app-moldura relative h-full w-full max-w-107.5 overflow-hidden border-x border-line [contain:paint]">
        <div className="app-scroller relative h-full overflow-y-auto" ref={scroller}>
          {children}
        </div>
        {/* O dedo: um toque que arrasta para cima, de novo e de novo, como quem rola (só com movimento). */}
        <span
          className="hidden motion-safe:block absolute z-10 left-[68%] bottom-[16%] size-14 rounded-full bg-white/20 ring-2 ring-white/50 pointer-events-none opacity-0 animate-finger"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
