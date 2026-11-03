import { useLayoutEffect, useRef } from "react";
import { semMovimento } from "../../sensorial/tokens.js";
import { topoEm } from "../../sensorial/regua.js";

const VELOCIDADE = 1100; // px por segundo, constante (se a tela nao pedir outra)

/**
 * Uma tela do app Lithium, rolada por um usuario: a moldura de celular (430 px no desktop, a tela toda no celular)
 * e a rolagem rapida e de velocidade constante, que ja comeca andando (sem espera). `escopo` e a classe a que o CSS
 * da tela esta restrito (estilos/app-telas.css, @scope). Os `data-revelar` entram pela rolagem, como no app.
 *
 * Cada tela rola so um trecho, definido pelo que aparece na tela:
 *   `de`  { alvo, y }: comeca rolada ate o elemento `alvo` (seletor) ficar com o topo a `y` px do topo da tela;
 *   `ate` { alvo, y }: rola do topo ate o `alvo` chegar a `y`, em exatamente `duracao` ms (a velocidade sai da distancia, e vai
 *   para `aoMedir`, em px/s); sem `ate`, anda por `duracao` ms a `velocidade` px/s e para. Quem tira a tela de cena e o video
 *   (Video.jsx), na hora da batida. Sob movimento reduzido nao rola: fica em `de`.
 *
 * `inicioEm` (ms, no relogio de `performance.now()`): a hora em que o estagio devia entrar. A rolagem com `ate` conta dele, e nao do primeiro
 * quadro depois de montar: se o React monta tarde (celular, CPU carregada), a tela chega ao alvo na hora do corte seguinte, e
 * nao depois dele. Sem `inicioEm`, conta do primeiro quadro.
 *
 * Um dedo (toque translucido) arrasta para cima sobre a tela, em loop, enquanto ela rola.
 *
 * `mascarar`: a tela vira o recheio de uma forma (ver `MASCARA_DA_LOGO`): uma mascara que comeca tao grande que a forma
 * cobre a tela inteira e encolhe ate a forma ficar do tamanho final, no centro, com a tela rolando dentro dela. A tela e
 * escura e a forma sumiria no fundo preto: junto com a mascara, as cores se invertem (`invert` + `hue-rotate`, que mantem os
 * matizes), e a forma fica clara, com o app em tinta dentro, e se encaixa na logo branca do quadro seguinte.
 */
export function TelaDoApp({ escopo, children, de, ate, duracao = 1200, velocidade = VELOCIDADE, aoMedir, mascarar, ligada = true, inicioEm }) {
  const raiz = useRef(null);
  const moldura = useRef(null);
  const rolo = useRef(null);

  useLayoutEffect(() => {
    const no = rolo.current;
    const reduzido = semMovimento();
    const itens = no.querySelectorAll("[data-revelar]");
    const posicao = ({ alvo, y }) => topoEm(no.querySelector(alvo), no) - y;
    const inicio = de ? posicao(de) : 0;
    no.scrollTop = inicio;
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
    let quadro = 0, vivo = true, t0 = inicioEm ?? null, y = inicio;
    const andar = (agora) => {
      y = Math.min(fim, inicio + (Math.max(0, agora - t0) / 1000) * v);
      no.scrollTop = y;
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

  // A mascara e o filtro nascem pausados no quadro 0 (a forma cobre a tela e a inversao e nula: nada muda na imagem) e so
  // `ligada` os faz andar. Criar a camada mascarada so na batida do corte dava um quadro preto, mais longo no celular.
  const mascaras = useRef([]);
  useLayoutEffect(() => {
    if (!mascarar) return;
    const el = raiz.current;
    const { url, proporcao, foco, raio, largura, ms } = mascarar;
    const { width: W, height: H } = el.getBoundingClientRect();
    const final = largura(W), finalH = final * proporcao;
    // A forma comeca com `s` vezes o tamanho final, o bastante para o raio do ponto `foco` (o maior circulo dentro dela)
    // cobrir a tela, e esse ponto fica no centro da tela: assim a tela inteira esta dentro da forma.
    const s = (Math.hypot(W, H) / 2 / (raio * final)) * 1.05;
    const quadros = [
      { w: final * s, h: finalH * s, x: W / 2 - foco.x * final * s, y: H / 2 - foco.y * finalH * s },
      { w: final, h: finalH, x: (W - final) / 2, y: (H - finalH) / 2 },
    ].map(({ w, h, x, y }) => ({ WebkitMaskSize: `${w}px ${h}px, 100% 100%`, maskSize: `${w}px ${h}px, 100% 100%`, WebkitMaskPosition: `${x}px ${y}px, 0 0`, maskPosition: `${x}px ${y}px, 0 0` }));
    // Nos primeiros quadros a imagem da mascara ainda nao esta desenhada, e a tela mascarada some (aparecia o preto, ou o play
    // vermelho que fica atras). Uma camada opaca por baixo mantem a tela inteira ate la; depois sai, e so a logo mascara.
    const so = `url(${url})`, com = `${so}, linear-gradient(#000, #000)`;
    const estilo = { WebkitMaskImage: com, maskImage: com, WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat" };
    Object.assign(el.style, estilo, quadros[ligada ? 1 : 0]);
    mascaras.current = [];
    if (semMovimento()) { mascaras.current = quadros; return; }
    let quadro = requestAnimationFrame(() => { quadro = requestAnimationFrame(() => { quadro = requestAnimationFrame(() => { el.style.maskImage = el.style.webkitMaskImage = so; }); }); });
    const opcoes = { duration: ms, easing: "cubic-bezier(0.7, 0, 0.15, 1)", fill: "both" };
    const forma = el.animate(quadros, opcoes);
    // A inversao so na segunda metade: com a mascara ainda enorme a tela escura enche a forma, e no meio do caminho a
    // inversao parcial daria um cinza turvo; assim ela vira rapido, quando as letras ja aparecem.
    const cor = el.animate([{ filter: "invert(0) hue-rotate(0deg)" }, { filter: "invert(0) hue-rotate(0deg)", offset: 0.45 }, { filter: "invert(1) hue-rotate(180deg)", offset: 0.7 }, { filter: "invert(1) hue-rotate(180deg)" }], { duration: ms, easing: "linear", fill: "both" });
    mascaras.current = [forma, cor];
    if (!ligada) mascaras.current.forEach((a) => a.pause());
    return () => { cancelAnimationFrame(quadro); el.getAnimations().forEach((a) => a.cancel()); };
  }, [Boolean(mascarar)]);

  useLayoutEffect(() => {
    if (!mascarar || !ligada) return;
    const mold = moldura.current;
    // Sem movimento nao ha animacao: a forma ja nasce no tamanho final.
    if (semMovimento()) return void Object.assign(raiz.current.style, mascaras.current[1]);
    mascaras.current.forEach((a) => a.play());
    // A tela dentro da forma ocupa a largura da forma (no desktop a moldura tem 430 px e a logo, 1100).
    mold.style.transformOrigin = "50% 50%";
    const { largura, ms } = mascarar;
    mold.animate([{ transform: "scale(1)" }, { transform: `scale(${Math.max(1, largura(raiz.current.getBoundingClientRect().width) / mold.clientWidth)})` }], { duration: ms, easing: "cubic-bezier(0.7, 0, 0.15, 1)", fill: "both" });
  }, [ligada]);

  return (
    <div className={`${escopo} absolute inset-0 z-4 flex justify-center bg-void`} ref={raiz} aria-hidden="true" inert>
      <div className="app-moldura relative h-full w-full max-w-107.5 overflow-hidden border-x border-line [contain:paint]" ref={moldura}>
        <div className="app-rolo relative h-full overflow-y-auto" ref={rolo}>{children}</div>
        {/* O dedo: um toque que arrasta para cima, de novo e de novo, como quem rola (so com movimento; some na mascara). */}
        {!(mascarar && ligada) && <span className="hidden motion-safe:block absolute z-10 left-[68%] bottom-[16%] size-14 rounded-full bg-white/20 ring-2 ring-white/50 pointer-events-none opacity-0 animate-dedo" aria-hidden="true" />}
      </div>
    </div>
  );
}
