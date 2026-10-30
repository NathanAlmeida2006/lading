import { useLayoutEffect, useRef } from "react";

const VELOCIDADE = 1100; // px por segundo, constante (se a tela nao pedir outra)

/** O zoom do match cut entre duas telas: a primeira entra nele (`saida`, ms) e a seguinte sai dele (`entrada`, ms). */
export const ZOOM = { escala: 2.4, saida: 220, entrada: 320 };
const EASE_SAIDA = "cubic-bezier(0.55, 0, 1, 0.45)"; // acelera: o zoom "puxa" a tela
const EASE_ENTRADA = "cubic-bezier(0.16, 1, 0.3, 1)"; // expo-out: a tela assenta

/** Onde um elemento comeca no conteudo rolavel `no` (offsetTop acumulado: nao muda com o `transform` do reveal). */
const topoEm = (no, el) => {
  let topo = 0;
  for (let e = el; e && e !== no; e = e.offsetParent) topo += e.offsetTop;
  return topo;
};

/**
 * Uma tela do app Lithium, rolada por um usuario: a moldura de celular (430 px no desktop, a tela toda no celular)
 * e a rolagem rapida e de velocidade constante, que ja comeca andando (sem espera). `escopo` e a classe a que o CSS
 * da tela esta restrito (styles/app-*.css, @scope). Os `data-revelar` entram pela rolagem, como no app.
 *
 * Pensada para match cut entre duas telas: cada uma rola so um trecho, e o trecho e definido pelo que aparece na tela.
 *   `de`  { alvo, y }: comeca rolada ate o elemento `alvo` (seletor) ficar com o topo a `y` px do topo da tela;
 *   `ate` { alvo, y }: rola do topo ate o `alvo` chegar a `y`, em exatamente `duracao` ms (a velocidade sai da distancia, e vai
 *   para `aoMedir`, em px/s); sem `ate`, anda por `duracao` ms a `velocidade` px/s (a medida pela tela anterior, para o
 *   movimento casar) e para. Quem tira a tela de cena e o video (Video.jsx), na hora da batida. Sob movimento reduzido
 *   nao rola: fica em `de`.
 * Uma tela com `ate` e outra com `de`, no mesmo `alvo` e `y`, casam: o corte troca o conteudo e a forma fica no lugar.
 * Para o corte ser um zoom (punch-in / punch-out) sobre esse cartao, a primeira leva `zoomSaida` e a segunda `zoomEntrada`
 * ({ escala, ms }, ZOOM): a primeira se aproxima do cartao nos ultimos ms da rolagem, a segunda nasce aproximada e se afasta.
 *
 * `inicioEm` (ms, no relogio de `performance.now()`): a hora em que o estagio devia entrar. A rolagem com `ate` conta dele, e nao do primeiro
 * quadro depois de montar: se o React monta tarde (celular, CPU carregada), a tela chega ao cartao-alvo e ao zoom na hora do corte seguinte, e
 * nao depois dele. Sem `inicioEm`, conta do primeiro quadro.
 *
 * Um dedo (toque translucido) arrasta para cima sobre a tela, em loop, enquanto ela rola.
 *
 * `mascarar`: a tela vira o recheio de uma forma (ver `MASCARA_DA_LOGO`): uma mascara que comeca tao grande que a forma
 * cobre a tela inteira e encolhe ate a forma ficar do tamanho final, no centro, com a tela rolando dentro dela. A tela e
 * escura e a forma sumiria no fundo preto: junto com a mascara, as cores se invertem (`invert` + `hue-rotate`, que mantem os
 * matizes), e a forma fica clara, com o app em tinta dentro, e se encaixa na logo branca do quadro seguinte.
 */
export function TelaDoApp({ escopo, children, de, ate, duracao = 1200, velocidade = VELOCIDADE, aoMedir, zoomSaida, zoomEntrada, mascarar, inicioEm }) {
  const raiz = useRef(null);
  const moldura = useRef(null);
  const rolo = useRef(null);

  useLayoutEffect(() => {
    const no = rolo.current;
    const mold = moldura.current;
    const reduzido = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const itens = no.querySelectorAll("[data-revelar]");
    const posicao = ({ alvo, y }) => topoEm(no, no.querySelector(alvo)) - y;
    const inicio = de ? posicao(de) : 0;
    no.scrollTop = inicio;
    // O zoom gira em torno do centro do cartao-alvo.
    const ref = ate || de;
    const alvo = ref && no.querySelector(ref.alvo);
    mold.style.transformOrigin = `50% ${alvo ? ref.y + alvo.offsetHeight / 2 : no.clientHeight / 2}px`;
    if (zoomEntrada && !reduzido) {
      mold.animate([{ transform: `scale(${zoomEntrada.escala})` }, { transform: "scale(1)" }], { duration: zoomEntrada.ms, easing: EASE_ENTRADA });
    }
    const obs = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && e.target.setAttribute("data-visto", "")), { root: no, rootMargin: "0px 0px -8% 0px" });
    itens.forEach((i) => obs.observe(i));
    if (reduzido) {
      itens.forEach((i) => i.setAttribute("data-visto", ""));
      return () => obs.disconnect();
    }

    const maximo = no.scrollHeight - no.clientHeight;
    const fim = Math.min(maximo, ate ? posicao(ate) : inicio + (velocidade * duracao) / 1000);
    const v = ate ? Math.max(0, fim - inicio) / (duracao / 1000) : velocidade;
    aoMedir?.(v);
    let quadro = 0, vivo = true, t0 = inicioEm ?? null, zoomou = false, y = inicio;
    const andar = (agora) => {
      y = Math.min(fim, inicio + (Math.max(0, agora - t0) / 1000) * v);
      no.scrollTop = y;
      if (zoomSaida && !zoomou && fim - y <= (v * zoomSaida.ms) / 1000) {
        zoomou = true;
        const zoom = mold.animate([{ transform: "scale(1)" }, { transform: `scale(${zoomSaida.escala})` }], { duration: zoomSaida.ms, easing: EASE_SAIDA, fill: "forwards" });
        zoom.currentTime = Math.min(zoomSaida.ms, Math.max(0, zoomSaida.ms - ((fim - y) / v) * 1000)); // montou tarde: o zoom entra ja no ponto certo
      }
    };
    // Com `inicioEm`, o primeiro quadro ja sai no lugar em que a tela devia estar nesta hora.
    if (t0 != null) andar(performance.now());
    // O que ja esta na tela entra pronto, sem o fade de 600 ms do `data-revelar` (que nasce em opacity 0 e so liberaria no 1o callback do
    // IntersectionObserver, um ou dois quadros depois): num corte de video isso era a tela quase vazia, que enchia aos poucos.
    const caixa = no.getBoundingClientRect();
    const naTela = [...itens].filter((i) => { const r = i.getBoundingClientRect(); return r.bottom > caixa.top && r.top < caixa.bottom - caixa.height * 0.08; });
    naTela.forEach((i) => { i.style.transition = "none"; i.setAttribute("data-visto", ""); });
    void no.offsetWidth; // consolida o estilo sem transicao; so depois ela volta
    naTela.forEach((i) => i.style.removeProperty("transition"));
    const passo = (agora) => {
      if (!vivo) return;
      t0 ??= agora;
      andar(agora);
      if (y < fim) quadro = requestAnimationFrame(passo);
    };
    quadro = requestAnimationFrame(passo);
    return () => { vivo = false; cancelAnimationFrame(quadro); obs.disconnect(); };
  }, []);

  useLayoutEffect(() => {
    if (!mascarar) return;
    const el = raiz.current;
    const mold = moldura.current;
    const { url, proporcao, foco, raio, largura, ms } = mascarar;
    const { width: W, height: H } = el.getBoundingClientRect();
    const final = largura(W), finalH = final * proporcao;
    // A forma comeca com `s` vezes o tamanho final, o bastante para o raio do ponto `foco` (o maior circulo dentro dela)
    // cobrir a tela, e esse ponto fica no centro da tela: assim a tela inteira esta dentro da forma.
    const s = (Math.hypot(W, H) / 2 / (raio * final)) * 1.05;
    const quadros = [
      { w: final * s, h: finalH * s, x: W / 2 - foco.x * final * s, y: H / 2 - foco.y * finalH * s },
      { w: final, h: finalH, x: (W - final) / 2, y: (H - finalH) / 2 },
    ].map(({ w, h, x, y }) => ({ WebkitMaskSize: `${w}px ${h}px`, maskSize: `${w}px ${h}px`, WebkitMaskPosition: `${x}px ${y}px`, maskPosition: `${x}px ${y}px` }));
    const estilo = { WebkitMaskImage: `url(${url})`, maskImage: `url(${url})`, WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat" };
    Object.assign(el.style, estilo, quadros[1]);
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const opcoes = { duration: ms, easing: "cubic-bezier(0.7, 0, 0.15, 1)", fill: "both" };
    el.animate(quadros, opcoes);
    // A inversao so na segunda metade: com a mascara ainda enorme a tela escura enche a forma, e no meio do caminho a
    // inversao parcial daria um cinza turvo; assim ela vira rapido, quando as letras ja aparecem.
    el.animate([{ filter: "invert(0) hue-rotate(0deg)" }, { filter: "invert(0) hue-rotate(0deg)", offset: 0.45 }, { filter: "invert(1) hue-rotate(180deg)", offset: 0.7 }, { filter: "invert(1) hue-rotate(180deg)" }], { duration: ms, easing: "linear", fill: "both" });
    // A tela dentro da forma ocupa a largura da forma (no desktop a moldura tem 430 px e a logo, 1100).
    mold.style.transformOrigin = "50% 50%";
    mold.animate([{ transform: "scale(1)" }, { transform: `scale(${Math.max(1, final / mold.clientWidth)})` }], opcoes);
    return () => { el.getAnimations().forEach((a) => a.cancel()); };
  }, [Boolean(mascarar)]);

  return (
    <div className={`${escopo} absolute inset-0 z-4 flex justify-center bg-void`} ref={raiz} aria-hidden="true">
      <div className="app-moldura relative h-full w-full max-w-107.5 overflow-hidden border-x border-line [contain:paint]" ref={moldura}>
        <div className="app-rolo relative h-full overflow-y-auto" ref={rolo}>{children}</div>
        {/* O dedo: um toque que arrasta para cima, de novo e de novo, como quem rola (so com movimento; some na mascara). */}
        {!mascarar && <span className="hidden motion-safe:block absolute z-10 left-[68%] bottom-[16%] size-14 rounded-full bg-white/20 ring-2 ring-white/50 pointer-events-none opacity-0 animate-dedo" aria-hidden="true" />}
      </div>
    </div>
  );
}
