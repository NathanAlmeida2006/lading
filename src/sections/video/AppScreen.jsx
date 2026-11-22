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
    const obs = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && e.target.setAttribute("data-visto", "")), { root: node, rootMargin: "0px 0px -8% 0px" });
    items.forEach((i) => obs.observe(i));
    if (reduced) {
      items.forEach((i) => i.setAttribute("data-visto", ""));
      return () => obs.disconnect();
    }

    const max = node.scrollHeight - node.clientHeight;
    const end = Math.min(max, getPosition(to));
    const pace = Math.max(0, end) / (duration / 1000);
    onMeasure?.(pace);
    let frame = 0, alive = true, t0 = startAt ?? null, y = 0;
    const walk = (now) => {
      y = Math.min(end, (Math.max(0, now - t0) / 1000) * pace);
      node.scrollTop = y;
    };
    // Com `startAt`, o primeiro quadro ja sai no lugar em que a tela devia estar nesta hora.
    if (t0 != null) walk(performance.now());
    // O que ja esta na tela entra pronto, sem o fade de 600 ms do `data-revelar` (que nasce em opacity 0 e so liberaria no 1o callback do
    // IntersectionObserver, um ou dois quadros depois): num corte de video isso era a tela quase vazia, que enchia aos poucos.
    const box = node.getBoundingClientRect();
    const onScreen = [...items].filter((i) => { const r = i.getBoundingClientRect(); return r.bottom > box.top && r.top < box.bottom - box.height * 0.08; });
    onScreen.forEach((i) => { i.style.transition = "none"; i.setAttribute("data-visto", ""); });
    void node.offsetWidth; // consolida o estilo sem transicao; so depois ela volta
    onScreen.forEach((i) => i.style.removeProperty("transition"));
    const step = (now) => {
      if (!alive) return;
      t0 ??= now;
      walk(now);
      if (y < end) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => { alive = false; cancelAnimationFrame(frame); obs.disconnect(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- intencional: to, duration, onMeasure e startAt sao lidos uma vez na montagem; rodar de novo reiniciaria a rolagem; rolo e ref estavel
}

/**
 * Uma tela do app Lithium, rolada por um usuario: a moldura de celular (430 px no desktop, a tela toda no celular)
 * e a rolagem rapida e de velocidade constante, que ja comeca andando (sem espera). `scope` e a classe a que o CSS
 * da tela esta restrito (styles/app-screens.css, por prefixo de seletor). Os `data-revelar` entram pela rolagem, como no app.
 *
 * A tela rola so um trecho, definido pelo que aparece nela: `to` { target, y } rola do topo ate o `target` (seletor) chegar
 * a `y` px do topo da tela, em exatamente `duration` ms (a velocidade sai da distancia, e vai para `onMeasure`, em px/s).
 * Quem tira a tela de cena e o video (Video.jsx), na hora da batida. Sob movimento reduzido nao rola: fica no topo.
 *
 * `startAt` (ms, no relogio de `performance.now()`): a hora em que o estagio devia entrar. A rolagem com `to` conta dele, e nao do primeiro
 * quadro depois de montar: se o React monta tarde (celular, CPU carregada), a tela chega ao alvo na hora do corte seguinte, e
 * nao depois dele. Sem `startAt`, conta do primeiro quadro.
 *
 * Um dedo (toque translucido) arrasta para cima sobre a tela, em loop, enquanto ela rola.
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
    <div className={`${scope} absolute inset-0 z-4 flex justify-center bg-void`} aria-hidden="true" inert>
      <div className="app-moldura relative h-full w-full max-w-107.5 overflow-hidden border-x border-line [contain:paint]">
        <div className="app-rolo relative h-full overflow-y-auto" ref={scroller}>{children}</div>
        {/* O dedo: um toque que arrasta para cima, de novo e de novo, como quem rola (so com movimento). */}
        <span className="hidden motion-safe:block absolute z-10 left-[68%] bottom-[16%] size-14 rounded-full bg-white/20 ring-2 ring-white/50 pointer-events-none opacity-0 animate-dedo" aria-hidden="true" />
      </div>
    </div>
  );
}
