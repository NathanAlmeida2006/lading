import { useLayoutEffect, useRef } from "react";
import { isMotionReduced } from "../../sensory/tokens.js";
import { getTopWithin } from "../../sensory/ruler.js";

const DEFAULT_SPEED = 1100; // px por segundo, constante (se a tela nao pedir outra)

/**
 * Rola a tela do app de um trecho a outro, em velocidade constante ou por duração fixa.
 * @param {{current: HTMLElement|null}} scroller - Ref da área rolável.
 * @param {object} options - Trecho `from` e `to`, duração, velocidade, `onMeasure` e `startAt`.
 * @returns {void}
 */
function useScrolling(scroller, { from, to, duration, speed, onMeasure, startAt }) {
  useLayoutEffect(() => {
    const node = scroller.current;
    const reduced = isMotionReduced();
    const items = node.querySelectorAll("[data-revelar]");
    const getPosition = ({ target, y }) => getTopWithin(node.querySelector(target), node) - y;
    const start = from ? getPosition(from) : 0;
    node.scrollTop = start;
    const obs = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && e.target.setAttribute("data-visto", "")), { root: node, rootMargin: "0px 0px -8% 0px" });
    items.forEach((i) => obs.observe(i));
    if (reduced) {
      items.forEach((i) => i.setAttribute("data-visto", ""));
      return () => obs.disconnect();
    }

    const max = node.scrollHeight - node.clientHeight;
    const end = Math.min(max, to ? getPosition(to) : start + (speed * duration) / 1000);
    const pace = to ? Math.max(0, end - start) / (duration / 1000) : speed;
    onMeasure?.(pace);
    let frame = 0, alive = true, t0 = startAt ?? null, y = start;
    const walk = (now) => {
      y = Math.min(end, start + (Math.max(0, now - t0) / 1000) * pace);
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- intencional: from, to, duration, speed, onMeasure e startAt sao lidos uma vez na montagem; rodar de novo reiniciaria a rolagem; rolo e ref estavel
}

/**
 * Anima a máscara da logo sobre a tela do app, invertendo as cores junto.
 * @param {object} options - Refs `root` e `frameRef`, a `mask`, e `isOn`, que liga a animação.
 * @returns {void}
 */
function useLogoMask({ root, frameRef, mask, isOn }) {
  // A mascara e o filtro nascem pausados no quadro 0 (a forma cobre a tela e a inversao e nula: nada muda na imagem) e so
  // `isOn` os faz andar. Criar a camada mascarada so na batida do corte dava um quadro preto, mais longo no celular.
  const masks = useRef([]);
  useLayoutEffect(() => {
    if (!mask) return;
    const el = root.current;
    const { url, ratio, focus, radius, getWidth, ms } = mask;
    const { width: W, height: H } = el.getBoundingClientRect();
    const finalWidth = getWidth(W), finalHeight = finalWidth * ratio;
    // A forma comeca com `s` vezes o tamanho final, o bastante para o raio do ponto `focus` (o maior circulo dentro dela)
    // cobrir a tela, e esse ponto fica no centro da tela: assim a tela inteira esta dentro da forma.
    const s = (Math.hypot(W, H) / 2 / (radius * finalWidth)) * 1.05;
    const frames = [
      { w: finalWidth * s, h: finalHeight * s, x: W / 2 - focus.x * finalWidth * s, y: H / 2 - focus.y * finalHeight * s },
      { w: finalWidth, h: finalHeight, x: (W - finalWidth) / 2, y: (H - finalHeight) / 2 },
    ].map(({ w, h, x, y }) => ({ WebkitMaskSize: `${w}px ${h}px, 100% 100%`, maskSize: `${w}px ${h}px, 100% 100%`, WebkitMaskPosition: `${x}px ${y}px, 0 0`, maskPosition: `${x}px ${y}px, 0 0` }));
    // Nos primeiros quadros a imagem da mascara ainda nao esta desenhada, e a tela mascarada some (aparecia o preto, ou o play
    // vermelho que fica atras). Uma camada opaca por baixo mantem a tela inteira ate la; depois sai, e so a logo mascara.
    const solid = `url(${url})`, layered = `${solid}, linear-gradient(#000, #000)`;
    const styles = { WebkitMaskImage: layered, maskImage: layered, WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat" };
    Object.assign(el.style, styles, frames[isOn ? 1 : 0]);
    masks.current = [];
    if (isMotionReduced()) { masks.current = frames; return; }
    let frame = requestAnimationFrame(() => { frame = requestAnimationFrame(() => { frame = requestAnimationFrame(() => { el.style.maskImage = el.style.webkitMaskImage = solid; }); }); });
    const options = { duration: ms, easing: "cubic-bezier(0.7, 0, 0.15, 1)", fill: "both" };
    const shape = el.animate(frames, options);
    // A inversao so na segunda metade: com a mascara ainda enorme a tela escura enche a forma, e no meio do caminho a
    // inversao parcial daria um cinza turvo; assim ela vira rapido, quando as letras ja aparecem.
    const tint = el.animate([{ filter: "invert(0) hue-rotate(0deg)" }, { filter: "invert(0) hue-rotate(0deg)", offset: 0.45 }, { filter: "invert(1) hue-rotate(180deg)", offset: 0.7 }, { filter: "invert(1) hue-rotate(180deg)" }], { duration: ms, easing: "linear", fill: "both" });
    masks.current = [shape, tint];
    if (!isOn) masks.current.forEach((a) => a.pause());
    return () => { cancelAnimationFrame(frame); el.getAnimations().forEach((a) => a.cancel()); };
  }, [Boolean(mask)]); // eslint-disable-line react-hooks/exhaustive-deps -- intencional: roda so quando a mascara passa a existir ou deixa de existir (por isso Boolean); mascarar e ligada sao lidos na montagem, e ligada so liga as animacoes ja criadas no efeito seguinte; raiz e ref estavel

  useLayoutEffect(() => {
    if (!mask || !isOn) return;
    const frameEl = frameRef.current;
    // Sem movimento nao ha animacao: a forma ja nasce no tamanho final.
    if (isMotionReduced()) return void Object.assign(root.current.style, masks.current[1]);
    masks.current.forEach((a) => a.play());
    // A tela dentro da forma ocupa a largura da forma (no desktop a moldura tem 430 px e a logo, 1100).
    frameEl.style.transformOrigin = "50% 50%";
    const { getWidth, ms } = mask;
    frameEl.animate([{ transform: "scale(1)" }, { transform: `scale(${Math.max(1, getWidth(root.current.getBoundingClientRect().width) / frameEl.clientWidth)})` }], { duration: ms, easing: "cubic-bezier(0.7, 0, 0.15, 1)", fill: "both" });
  }, [isOn]); // eslint-disable-line react-hooks/exhaustive-deps -- intencional: dispara so quando ligada muda; mascarar vem da renderizacao dessa mudanca; moldura e raiz sao refs estaveis
}

/**
 * Uma tela do app Lithium, rolada por um usuario: a moldura de celular (430 px no desktop, a tela toda no celular)
 * e a rolagem rapida e de velocidade constante, que ja comeca andando (sem espera). `scope` e a classe a que o CSS
 * da tela esta restrito (styles/app-screens.css, @scope). Os `data-revelar` entram pela rolagem, como no app.
 *
 * Cada tela rola so um trecho, definido pelo que aparece na tela:
 *   `from`  { alvo, y }: comeca rolada ate o elemento `target` (seletor) ficar com o topo a `y` px do topo da tela;
 *   `to` { alvo, y }: rola do topo ate o `target` chegar a `y`, em exatamente `duration` ms (a velocidade sai da distancia, e vai
 *   para `onMeasure`, em px/s); sem `to`, anda por `duration` ms a `speed` px/s e para. Quem tira a tela de cena e o video
 *   (Video.jsx), na hora da batida. Sob movimento reduzido nao rola: fica em `from`.
 *
 * `startAt` (ms, no relogio de `performance.now()`): a hora em que o estagio devia entrar. A rolagem com `to` conta dele, e nao do primeiro
 * quadro depois de montar: se o React monta tarde (celular, CPU carregada), a tela chega ao alvo na hora do corte seguinte, e
 * nao depois dele. Sem `startAt`, conta do primeiro quadro.
 *
 * Um dedo (toque translucido) arrasta para cima sobre a tela, em loop, enquanto ela rola.
 *
 * `mask`: a tela vira o recheio de uma forma (ver `LOGO_MASK`): uma mascara que comeca tao grande que a forma
 * cobre a tela inteira e encolhe ate a forma ficar do tamanho final, no centro, com a tela rolando dentro dela. A tela e
 * escura e a forma sumiria no fundo preto: junto com a mascara, as cores se invertem (`invert` + `hue-rotate`, que mantem os
 * matizes), e a forma fica clara, com o app em tinta dentro, e se encaixa na logo branca do quadro seguinte.
 * @param {object} props
 * @param {string} props.scope - Classe a que o CSS da tela está restrito (@scope).
 * @param {ReactNode} props.children - Conteúdo da tela.
 * @param {{target: string, y: number}} [props.from] - Trecho inicial: rola até `target` ficar a `y` px do topo.
 * @param {{target: string, y: number}} [props.to] - Trecho da rolagem: do topo até `target` chegar a `y` px.
 * @param {number} [props.duration=1200] - Tempo da rolagem, em ms.
 * @param {number} [props.speed] - Velocidade constante, em px/s, quando não há `to`.
 * @param {(speed: number) => void} [props.onMeasure] - Recebe a velocidade calculada.
 * @param {object} [props.mask] - Máscara da logo (ver LOGO_MASK em LithiumLogo.jsx).
 * @param {boolean} [props.isOn=true] - Liga a máscara e a animação dela.
 * @param {number} [props.startAt] - Hora em que o estágio devia entrar.
 * @returns {JSX.Element} A moldura de celular, com a tela rolando.
 */
export function AppScreen({ scope, children, from, to, duration = 1200, speed = DEFAULT_SPEED, onMeasure, mask, isOn = true, startAt }) {
  const root = useRef(null);
  const frameRef = useRef(null);
  const scroller = useRef(null);
  useScrolling(scroller, { from, to, duration, speed, onMeasure, startAt });
  useLogoMask({ root, frameRef, mask, isOn });

  return (
    <div className={`${scope} absolute inset-0 z-4 flex justify-center bg-void`} ref={root} aria-hidden="true" inert>
      <div className="app-moldura relative h-full w-full max-w-107.5 overflow-hidden border-x border-line [contain:paint]" ref={frameRef}>
        <div className="app-rolo relative h-full overflow-y-auto" ref={scroller}>{children}</div>
        {/* O dedo: um toque que arrasta para cima, de novo e de novo, como quem rola (so com movimento; some na mascara). */}
        {!(mask && isOn) && <span className="hidden motion-safe:block absolute z-10 left-[68%] bottom-[16%] size-14 rounded-full bg-white/20 ring-2 ring-white/50 pointer-events-none opacity-0 animate-dedo" aria-hidden="true" />}
      </div>
    </div>
  );
}
