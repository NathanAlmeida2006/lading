/**
 * Movimento da pagina, em anime.js.
 *
 * A assinatura do sistema e o CORTE SECO (mestre visual §10): revelacao de
 * marca usa `steps(2)` ou `steps(3)`, nunca transicao continua. E o idioma de
 * impressao do cartaz aplicado ao tempo.
 *
 * A engenharia reversa do Burocratik trouxe um segundo vocabulario: mascara de
 * linha, parallax, marquise e numero cru como ornamento. Os dois convivem por
 * uma regra clara:
 *
 *   - REVELACAO DE MARCA e corte seco, em `steps()`. Carimbo, numero, sigilo.
 *   - MOVIMENTO DE LAYOUT e continuo, em expo-out. Mascara, parallax, painel.
 *
 * Misturar os dois apaga a assinatura: se tudo corta, o corte deixa de
 * significar. O corte e o acento do movimento, e acento se usa uma vez.
 *
 * Tres travas valem para tudo o que este arquivo faz:
 *
 *   1. Com `prefers-reduced-motion`, todo efeito degrada para opacidade.
 *   2. O estado inicial e escrito por JS, nunca por CSS de arquivo. Sem JS a
 *      pagina abre inteira e legivel (RNF-L16).
 *   3. Conteudo nunca fica preso invisivel (RNF-L35). O gatilho de revelacao e
 *      IntersectionObserver nativo, e ha uma varredura de seguranca no fim.
 *
 * O `onScroll` do anime.js aparece aqui em um uso so: parallax ligado a
 * rolagem, que e para o que ele serve. Como gatilho de revelacao ele deixou
 * 14 de 30 elementos invisiveis, e por isso quem revela e o observador nativo.
 * A diferenca de risco importa: parallax que falha nao anima; revelacao que
 * falha esconde o texto.
 */
import {
  animate,
  createDrawable,
  createTimeline,
  onScroll,
  stagger,
  steps,
  utils,
} from "animejs";
import { duracao, semMovimento } from "./tokens.js";

const MARGEM = "0px 0px -80px 0px";

// Curva expo-out: o movimento de layout do vocabulario editorial.
const EXPO = "cubicBezier(0.16, 1, 0.3, 1)";

// Sticky so e declarado nestes quatro lugares no CSS. Quem declarar
// `position: sticky` numa classe nova precisa cita-la aqui: e o mesmo fato
// duplicado em JS, e e por isso que as duas listas em `empilharBlocos()` e
// `empilharSecoes()` existiam identicas antes desta constante.
const SELETORES_GRUDE = ".secao__cabeca, .mapa__trilha, .fase, .painel-cap";

/**
 * Ha algo grudado (`position: sticky`) dentro deste elemento?
 *
 * `getComputedStyle`, nao so a lista de classes: `.secao__cabeca` so gruda a
 * partir de 768px, e a classe sozinha nao sabe disso.
 */
function temAlgoGrudado(elemento) {
  return [...elemento.querySelectorAll(SELETORES_GRUDE)].some(
    (el) => getComputedStyle(el).position === "sticky",
  );
}

let observador = null;
const pendentes = new WeakMap();

/**
 * Quem ainda nao disparou. Existe porque o IntersectionObserver PERDE callback
 * em rolagem rapida: com saltos de 400px o navegador junta as notificacoes e
 * elementos que atravessaram a viewport nunca recebem a sua. Medido: dois
 * elementos do fechamento ficavam em opacidade 0 por 2,5 s ate a rede de
 * seguranca do RNF-L35 alcancar.
 *
 * A varredura abaixo cobre o furo disparando a ANIMACAO de verdade, e nao
 * apenas forcando a opacidade. Quem chegou rolando rapido ve o movimento; a
 * rede de seguranca continua existindo, para o caso que nem isto cobre.
 */
const aguardando = new Set();
let varreduraLigada = false;
let relogioVarredura = null;

function disparar(alvo) {
  if (!aguardando.has(alvo)) return;
  aguardando.delete(alvo);
  observador?.unobserve(alvo);
  const acao = pendentes.get(alvo);
  pendentes.delete(alvo);
  acao?.();
}

function varrerPendentes() {
  if (!aguardando.size) return;
  const limite = window.innerHeight - 80;
  for (const alvo of [...aguardando]) {
    const caixa = alvo.getBoundingClientRect();
    if (caixa.top < limite && caixa.bottom > 0) disparar(alvo);
  }
}

function ligarVarredura() {
  if (varreduraLigada) return;
  varreduraLigada = true;
  // Sai de cena quando a fila esvazia. Nenhuma revelacao nova e registrada
  // depois da montagem, entao fila vazia e o fim do trabalho deste ouvinte, e
  // deixa-lo ligado e um par clearTimeout/setTimeout por evento de rolagem
  // pelo resto da visita.
  const aoRolar = () => {
    if (!aguardando.size) {
      varreduraLigada = false;
      window.removeEventListener("scroll", aoRolar);
      return;
    }
    clearTimeout(relogioVarredura);
    relogioVarredura = setTimeout(varrerPendentes, 120);
  };
  window.addEventListener("scroll", aoRolar, { passive: true });
}

function aoEntrar(gatilho, executar) {
  if (!gatilho) return;
  if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
    executar();
    return;
  }
  if (!observador) {
    observador = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (entrada.isIntersecting) disparar(entrada.target);
        }
      },
      { rootMargin: MARGEM, threshold: 0 },
    );
  }
  pendentes.set(gatilho, executar);
  aguardando.add(gatilho);
  observador.observe(gatilho);
  ligarVarredura();
}

/**
 * Um laco infinito so anda enquanto da para ver.
 *
 * A marquise e a seta piscante nao terminam nunca: sem isto elas ocupam a
 * `requestAnimationFrame` da pagina inteira do primeiro quadro ao ultimo, e
 * mantem uma camada de composicao viva por faixa, mesmo com as quatro faixas
 * fora da tela ao mesmo tempo. E trabalho continuo de processador e bateria
 * para pintar o que ninguem esta olhando.
 *
 * Nao muda o que se ve: o conteudo do laco e a mesma frase repetida, entao a
 * fase em que ele retoma nao carrega informacao nenhuma.
 */
function pausarForaDaTela(alvo, animacao) {
  if (!alvo || !animacao) return () => {};
  if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
    return () => animacao.pause();
  }
  animacao.pause();
  const observador = new IntersectionObserver(
    ([entrada]) => (entrada.isIntersecting ? animacao.play() : animacao.pause()),
    { rootMargin: "200px 0px" },
  );
  observador.observe(alvo);
  return () => {
    observador.disconnect();
    animacao.pause();
  };
}

/* -------------------------------------------------------------------------
   Revelacao
   ------------------------------------------------------------------------- */

/** Aparicao simples ligada a rolagem. O caso comum de todo bloco. */
export function revelar(alvo, { atraso = 0, deslocamento = 12 } = {}) {
  if (!alvo) return;
  const reduzido = semMovimento();
  utils.set(alvo, { opacity: 0, y: reduzido ? 0 : deslocamento });
  aoEntrar(alvo, () =>
    animate(alvo, {
      opacity: [0, 1],
      y: reduzido ? 0 : [deslocamento, 0],
      duration: reduzido ? duracao("--motion-fast") : duracao("--motion-base"),
      delay: atraso,
      ease: reduzido ? "linear" : steps(2),
    }),
  );
}

/** Varios elementos entrando em cascata, com o mesmo corte. */
export function revelarEmCascata(alvos, { intervalo = 70 } = {}) {
  const lista = Array.from(alvos ?? []);
  if (!lista.length) return;
  const reduzido = semMovimento();
  utils.set(lista, { opacity: 0, y: reduzido ? 0 : 10 });

  // Cada item tem o proprio gatilho: uma lista longa nao cabe na viewport, e
  // disparar a cascata inteira pelo primeiro item animaria no vazio o que
  // ainda esta tres telas abaixo.
  for (const [indice, item] of lista.entries()) {
    aoEntrar(item, () =>
      animate(item, {
        opacity: [0, 1],
        y: reduzido ? 0 : [10, 0],
        duration: reduzido ? duracao("--motion-fast") : duracao("--motion-base"),
        delay: reduzido ? 0 : Math.min(indice, 3) * intervalo,
        ease: reduzido ? "linear" : steps(2),
      }),
    );
  }
}

/**
 * Mascara de linha: as linhas do titulo sobem de dentro de um recorte.
 *
 * E o movimento mais caro da pagina e o que mais muda a percepcao dela. Nao
 * usa corte seco de proposito: e movimento de layout, nao revelacao de marca.
 * Contra-exemplo util - se o titulo tambem cortasse, o carimbo do numero da
 * prova deixaria de ser um evento.
 */
export async function mascaraDeLinha(alvo, { atraso = 0, intervalo = 90 } = {}) {
  if (!alvo) return;
  if (semMovimento()) return revelar(alvo, { atraso, deslocamento: 0 });

  // Dinamico de proposito, e medido: o modulo de texto do anime.js sai num
  // pedaco separado, e trazer esse pedaco para o pacote principal por import
  // estatico custava cerca de 90 ms de avaliacao no arranque, num aparelho onde
  // o processador ja e o gargalo. Noventa milissegundos na frente de TUDO valem
  // mais que a ida e volta que economizam, e a ida e volta ja sai do caminho de
  // graca: `scripts/prerender.mjs` declara `modulepreload` para este pedaco, e
  // ele passa a baixar em paralelo com o pacote principal em vez de esperar.
  const { splitText } = await import("animejs");
  const fatias = splitText(alvo, {
    lines: { wrap: "clip" },
    words: false,
    chars: false,
    accessible: true,
  });
  const linhas = fatias.lines;
  if (!linhas?.length) return revelar(alvo, { atraso });

  // Quem anima daqui para baixo sao as linhas; o pai precisa sair do opacity 0
  // do [data-revelar] na mao, senao o titulo nunca aparece.
  utils.set(alvo, { opacity: 1 });
  utils.set(linhas, { y: "110%" });
  aoEntrar(alvo, () =>
    animate(linhas, {
      y: ["110%", "0%"],
      duration: 780,
      delay: stagger(intervalo, { start: atraso }),
      ease: EXPO,
    }),
  );
}

/**
 * O carimbo: a revelacao de marca.
 *
 * Tres degraus, na duracao de celebracao. Reservado ao numero da prova e ao
 * fechamento; usa-lo em texto corrido gastaria a assinatura.
 */
export function carimbar(alvo, { atraso = 0, naRolagem = false } = {}) {
  if (!alvo) return;
  const reduzido = semMovimento();
  utils.set(alvo, { opacity: 0, scale: reduzido ? 1 : 1.14 });
  const tocar = () =>
    animate(alvo, {
      opacity: [0, 1],
      scale: reduzido ? 1 : [1.14, 1],
      duration: reduzido ? duracao("--motion-fast") : duracao("--motion-celebracao"),
      delay: atraso,
      ease: reduzido ? "linear" : steps(3),
    });
  if (naRolagem) aoEntrar(alvo, tocar);
  else tocar();
}

/**
 * Desenha um traco de SVG. Serve a moldura da dobra e a regua da prova.
 * Sob movimento reduzido o traco ja nasce inteiro e so aparece.
 */
export function desenhar(alvos, { atraso = 0, naRolagem = true, tempo } = {}) {
  const lista = Array.from(alvos ?? []).filter(Boolean);
  if (!lista.length) return;
  const reduzido = semMovimento();

  const tocar = () => {
    if (reduzido) {
      animate(lista, {
        opacity: [0, 1],
        duration: duracao("--motion-fast"),
        delay: atraso,
        ease: "linear",
      });
      return;
    }
    animate(createDrawable(lista), {
      draw: ["0 0", "0 1"],
      duration: tempo ?? duracao("--motion-slow") * 2,
      delay: stagger(60, { start: atraso }),
      ease: "out(2)",
    });
  };

  if (reduzido) utils.set(lista, { opacity: 0 });
  if (naRolagem) aoEntrar(lista[0], tocar);
  else tocar();
}

/* -------------------------------------------------------------------------
   Movimento ligado a rolagem
   ------------------------------------------------------------------------- */

/**
 * Parallax. Fator de 0,06 a 0,16 da altura da viewport: o suficiente para dar
 * profundidade, pouco o suficiente para nao virar enjoo no celular.
 *
 * Falhar aqui nao esconde nada - no pior caso o elemento fica parado - e por
 * isso este e o unico lugar onde o `onScroll` da biblioteca e aceitavel.
 */
export function parallaxe(alvo, { fator = 0.1 } = {}) {
  if (!alvo || semMovimento() || typeof window === "undefined") return;
  // Teto de 72px. Sem ele o deslocamento acompanha a altura da janela, e numa
  // janela alta o ornamento sai da propria secao e cai por cima do texto de
  // baixo. Parallax e profundidade, nao viagem.
  const curso = Math.min(Math.round(window.innerHeight * fator), 72);
  return animate(alvo, {
    y: [curso, -curso],
    ease: "linear",
    autoplay: onScroll({
      // O limiar se le "<borda da janela> <borda do alvo>", e a ORDEM importa:
      // escrito ao contrario (`enter: "top bottom"`, `leave: "bottom top"`) o
      // fim cai antes do comeco, a biblioteca zera a distancia sem avisar, e o
      // que sobra nao e parallax - e um deslocamento FIXO de 72px, que foi o
      // que empurrou o numero cru do catalogo para tras dos cartoes.
      //
      // Aqui: comeca quando o rodape da janela alcanca o topo do alvo, termina
      // quando o topo da janela alcanca o rodape dele. A travessia inteira.
      enter: "bottom top",
      leave: "top bottom",
      sync: 0.35,
    }),
  });
}

/**
 * Marquise: faixa horizontal em laco.
 *
 * Vem da engenharia reversa do Burocratik, onde a frase da marca entra em loop
 * antes do heroi. Aqui ela separa os blocos de tema e carrega os ornamentos.
 * O conteudo e duplicado no markup para o laco nao ter costura visivel, e a
 * copia leva `aria-hidden`.
 */
export function marquise(trilho, { tempo = 26000, sentido = -1 } = {}) {
  if (!trilho || semMovimento()) return;

  // Uma metade precisa ser MAIS LARGA que a janela, e essa e a regra inteira do
  // laco. Com tres ou quatro palavras num monitor de 2560px a metade mede menos
  // que a tela: o deslocamento leva o fim dela para dentro do quadro antes de a
  // outra entrar, e o que aparece e um vao correndo junto com o texto. No
  // celular nunca deu as caras porque la qualquer metade ja passava da tela.
  //
  // Entao se falta largura, repete-se o conteudo ate cobrir. As copias levam
  // `aria-hidden`: a frase e a mesma, e o leitor de tela ja a ouviu uma vez.
  const metades = [...trilho.children];
  const janela = trilho.parentElement?.clientWidth ?? 0;
  const uma = metades[0]?.scrollWidth ?? 0;
  let fator = 1;

  if (metades.length === 2 && uma > 0 && uma < janela) {
    fator = Math.ceil(janela / uma) + 1;
    for (const metade of metades) {
      const base = [...metade.children];
      for (let copia = 1; copia < fator; copia += 1) {
        for (const item of base) {
          const clone = item.cloneNode(true);
          clone.setAttribute("aria-hidden", "true");
          metade.append(clone);
        }
      }
    }
  }

  const largura = trilho.scrollWidth / 2;
  if (!largura) return;

  // A duracao acompanha o comprimento, senao repetir o conteudo acelera a faixa
  // na mesma proporcao e a leitura vira borrao no monitor largo.
  const laco = animate(trilho, {
    x: sentido < 0 ? [0, -largura] : [-largura, 0],
    duration: tempo * fator,
    ease: "linear",
    loop: true,
  });

  return pausarForaDaTela(trilho.parentElement ?? trilho, laco);
}

/**
 * A regua mede enquanto voce rola.
 *
 * O argumento deste angulo e de REGUA, entao a regua e o unico elemento da
 * pagina que merece movimento ligado a rolagem em vez de disparado por ela: o
 * marcador percorre a faixa conforme a secao passa, e o visitante ve a medicao
 * acontecer em vez de ver o resultado pronto.
 */
export function medirNaRolagem(marcador, contexto, { de = 0, ate = 1 } = {}) {
  if (!marcador || !contexto) return;
  if (semMovimento()) {
    utils.set(marcador, { opacity: 1, scaleX: ate });
    return;
  }
  utils.set(marcador, { opacity: 1 });
  return animate(marcador, {
    scaleX: [de, ate],
    ease: "linear",
    autoplay: onScroll({
      target: contexto,
      enter: "bottom-=120 top",
      leave: "top+=120 bottom",
      sync: 0.5,
    }),
  });
}


/**
 * A trilha das 12 semanas: os quadrados acendem e apagam com a rolagem.
 *
 * Nao e um preenchimento que so cresce. O progresso e LIGADO a posicao da
 * pagina, entao rolar para cima apaga na mesma ordem em que acendeu. O
 * visitante pode varrer o caminho para frente e para tras, e a trilha responde.
 *
 * A implementacao anterior eram duas camadas identicas com a viva recortada por
 * altura. Funcionava para encher, mas o recorte nao tem estado por semana: nao
 * dava para destacar a semana corrente nem para cada quadrado ter o proprio
 * corte seco. Agora o anime.js anima um numero, e o numero manda nas classes.
 *
 * Sob movimento reduzido a trilha nasce inteira acesa: ela INFORMA o caminho, e
 * informacao nao pode depender de animacao (mestre §10).
 */
export function acenderTrilha(fio, semanas, contexto) {
  const lista = Array.from(semanas ?? []);
  if (!fio || !lista.length || !contexto) return;

  if (semMovimento()) {
    utils.set(fio, { scaleY: 1 });
    lista.forEach((el) => el.classList.add("trilha__semana--acesa"));
    return;
  }

  utils.set(fio, { scaleY: 0 });
  const estado = { avanco: 0 };
  let ultimoDegrau = null;
  let ultimasAcesas = null;

  return animate(estado, {
    avanco: [0, lista.length],
    ease: "linear",
    autoplay: onScroll({
      target: contexto,
      enter: "bottom-=120 top",
      leave: "top+=180 bottom",
      sync: 0.45,
    }),
    onUpdate: () => {
      const ate = estado.avanco;
      utils.set(fio, { scaleY: ate / lista.length });

      // O fio e continuo, as classes nao: elas so mudam quando a rolagem cruza
      // um degrau. Escrever as 24 classes a cada quadro invalidava o estilo dos
      // doze quadrados por quadro para trocar coisa nenhuma em 11 de cada 12.
      const degrau = ate > 0.15 ? Math.min(Math.floor(ate), lista.length - 1) : -1;
      const acesas = Math.ceil(ate);   // `indice < ate` com indice inteiro.
      if (degrau === ultimoDegrau && acesas === ultimasAcesas) return;
      ultimoDegrau = degrau;
      ultimasAcesas = acesas;

      for (const [indice, el] of lista.entries()) {
        el.classList.toggle("trilha__semana--acesa", indice < acesas);
        el.classList.toggle("trilha__semana--atual", indice === degrau);
      }
    },
  });
}

/**
 * Sticky stacking: cada bloco gruda e o seguinte sobe por cima dele.
 *
 * O empilhamento em si e CSS (`position: sticky` com topo escalonado). O que o
 * JavaScript acrescenta e o PARALLAX ENTRE OS BLOCOS: o que esta sendo coberto
 * recua de escala e apaga, entao a pilha ganha profundidade em vez de parecer
 * um bloco tapando o outro.
 *
 * O ultimo bloco nao recua: nao ha nada acima dele para justificar a saida, e
 * apaga-lo deixaria a secao terminando em cinza.
 */
export function empilharBlocos(blocos, { interno = ".fase__cartao", corte = false } = {}) {
  const lista = Array.from(blocos ?? []);
  if (!lista.length || semMovimento()) return;
  for (const [indice, bloco] of lista.entries()) {
    if (indice === lista.length - 1) continue;
    const cartao = bloco.querySelector(interno) ?? bloco;

    // O apagamento vai no CONTEUDO, nunca na caixa. Cartao semitransparente
    // sobre cartao deixa o texto de baixo atravessar o de cima: com
    // `opacity: 0.82` no `.fase__cartao`, o resumo do Aprender aparecia por
    // dentro do titulo do Construir. A caixa fica opaca e quem recua e o texto,
    // que e justamente o que sobra visivel no degrau.
    animate([...cartao.children], {
      opacity: [1, 0.45],
      // `corte` e a decisao D5 da especificacao: a troca de painel de capitulo
      // e REVELACAO DE MARCA, e revelacao de marca corta. Os cartoes de fase
      // continuam em `linear`, que e movimento de layout.
      ease: corte ? steps(2) : "linear",
      autoplay: onScroll({ target: bloco, enter: "top top", leave: "top bottom", sync: 0.3 }),
    });

    // Escala SO onde nao ha nada grudado dentro, pela mesma razao do
    // `empilharSecoes()`: ancestral com `transform` deixa de ser transparente
    // para o `sticky` dos descendentes, e `scale(1)` conta. Com os cartoes de
    // fase do mapa dentro de um painel de capitulo, escalar o painel os
    // desgrudaria, que e o defeito que esta base ja pagou uma vez.
    const temGrude = temAlgoGrudado(cartao);

    const recuo = {
      // Recuo DISCRETO, ao contrario do recuo entre secoes. Numa pilha de
      // secoes a camada coberta some inteira e pode apagar a vontade; aqui os
      // tres cartoes ficam na tela ate o fim da secao, e sao o conteudo. Com
      // `opacity: 0.3` os dois primeiros viravam vulto atras do terceiro, que e
      // como o defeito foi relatado. A profundidade aqui vem do degrau, do fio
      // e de um recuo minimo de escala, nao de apagar o que ainda se le.
      ease: "linear",
      autoplay: onScroll({
        // O alvo e o <li>, que agora e quem gruda. Medir contra um elemento
        // grudado costuma ser erro, e aqui nao e: o `onScroll` do anime.js
        // neutraliza `sticky` no alvo e nos ancestrais antes de medir, entao o
        // que ele le e a posicao de FLUXO. (Conferido em `events/scroll.js`.)
        //
        // O limiar se le "<borda do container> <borda do alvo>". Comeca quando
        // o topo da janela alcanca o topo do <li>, que e o instante em que o
        // cartao gruda, e termina quando alcanca o rodape dele, que e uma tela
        // depois - exatamente o curso em que o cartao seguinte o cobre. Escrito
        // ao contrario ("bottom top") o fim acontece antes do comeco e nada
        // anima, que foi o defeito do `parallaxe()`.
        target: bloco,
        enter: "top top",
        leave: "top bottom",
        sync: 0.3,
      }),
    };
    // A chave nao entra no objeto. `scale: 1` nao e o mesmo que nao ter escala:
    // a biblioteca escreve `transform: scale(1)` do mesmo jeito. Sem escala
    // nao ha o que animar: chamar `animate` mesmo assim so registraria um
    // observador de rolagem inutil.
    if (!temGrude) {
      recuo.scale = [1, 0.97];
      animate(cartao, recuo);
    }
  }
}

/**
 * A altura de cada secao, para o `top` da pilha.
 *
 * O CSS sozinho nao resolve isto. `top: calc(100svh - 100%)` seria a forma
 * obvia, e ela nao funciona: em `position: sticky` a porcentagem do `top`
 * resolve contra o BLOCO DE CONTENCAO, que aqui e o `<main>` inteiro, e nao
 * contra a altura do proprio elemento. Envolver cada secao num involucro da
 * altura dela devolve a porcentagem certa e tira o curso: `sticky` so se move
 * dentro do bloco de contencao, e um involucro justo tem curso zero.
 *
 * Entao a altura vem daqui, e SO a altura. O `100svh` fica no CSS de proposito:
 * `window.innerHeight` mede a viewport do momento, encolhe e cresce com a barra
 * do navegador do celular, e o ponto de grude ficaria pulando a cada rolagem.
 *
 * `offsetHeight` nao enxerga o deslocamento do `sticky` - e altura de layout,
 * nao posicao - entao medir uma secao ja grudada da o mesmo numero. E escrever
 * `--altura` muda `top`, que nao muda altura: o observador nao se realimenta.
 *
 * `propriedade` tem default so por compatibilidade com o chamador de
 * `App.jsx`, que grava `--altura` na pilha de nivel superior. Uma segunda
 * pilha ANINHADA (o capitulo, um nivel abaixo) precisa de nome PROPRIO: custom
 * property herda, entao um painel sem `--altura-painel` conta so resolveria
 * `--altura` para a altura da SECAO inteira que o contem, nao o fallback
 * `100svh` do CSS - o `top: min(...)` congelaria cedo demais, sem nunca
 * disparar o defeito de forma obvia. Dois nomes distintos e cada um so existe
 * no proprio nivel da pilha: nao ha o que herdar.
 */
export function medirPilha(secoes, { propriedade = "--altura" } = {}) {
  const lista = Array.from(secoes ?? []);
  if (!lista.length || typeof window === "undefined") return () => {};

  const escrever = (secao) =>
    secao.style.setProperty(propriedade, `${Math.round(secao.offsetHeight)}px`);

  for (const secao of lista) escrever(secao);

  if (!("ResizeObserver" in window)) return () => {};

  // Altura de secao muda em uso: uma objecao que abre, o zoom de texto a 200%,
  // a troca de retrato para paisagem. Sem observar, o ponto de grude envelhece
  // em silencio e a secao passa a congelar cedo demais ou tarde demais.
  const observador = new ResizeObserver((entradas) => {
    for (const entrada of entradas) escrever(entrada.target);
  });
  for (const secao of lista) observador.observe(secao);
  return () => observador.disconnect();
}

/**
 * A pilha de secoes: a que esta sendo coberta recua e apaga.
 *
 * O empilhamento em si e CSS (`position: sticky; bottom: 0` com `min-height:
 * 100svh`), e por isso ele funciona sem JavaScript nenhum. O que este arquivo
 * acrescenta e a PROFUNDIDADE: sem o recuo, a pilha le como uma folha opaca
 * tapando a outra; com ele, le como camada indo para tras.
 *
 * E o mesmo tratamento que `empilharBlocos()` da aos cartoes de fase do mapa,
 * um nivel acima. A diferenca esta em QUEM mede.
 *
 * Quem gruda nunca e quem mede - mas aqui todo mundo gruda, entao a saida e
 * medir contra a secao SEGUINTE, e nao contra a propria. A janela e a
 * travessia dela: comeca quando o topo da seguinte aparece no rodape da
 * janela (o instante em que ela comeca a cobrir) e termina quando esse mesmo
 * topo alcanca o alto da janela (o instante em que a cobertura se completa).
 * Nesse intervalo a seguinte ainda esta em fluxo, entao ela se move e a medida
 * existe. Depois dele e que ela gruda.
 *
 * Recua o CONTEUDO, nunca a secao. Encolher a secao mostraria o vazio atras
 * dela, e o que se ve por tras de uma camada da pilha e a camada anterior.
 */
export function empilharSecoes(secoes) {
  const lista = Array.from(secoes ?? []);
  if (lista.length < 2 || semMovimento()) return;

  for (const [indice, secao] of lista.entries()) {
    const seguinte = lista[indice + 1];
    if (!seguinte) continue;

    // No painel o que recua e a mensagem; a moldura e os numeros crus ficam,
    // porque eles sao o campo, nao o conteudo. `.painel__centro` tambem carrega
    // `.envelope`, entao ele vem primeiro na busca.
    const conteudo = secao.querySelector(".painel__centro") ??
                     secao.querySelector(".envelope") ??
                     secao;

    // Escala SO onde nao ha nada grudado dentro.
    //
    // Um ancestral com `transform` deixa de ser transparente para o
    // `position: sticky` dos descendentes: eles param de grudar contra a janela
    // e passam a ser presos pela caixa transformada. E `scale(1)` conta - a
    // matriz identidade vale tanto quanto qualquer outra, entao o defeito
    // aparece antes de a animacao ter andado um pixel.
    //
    // Foi o que quebrou o mapa: os tres cartoes de fase e a trilha vivem dentro
    // do `.envelope` da secao, e com o `scale(1)` do recuo eles desgrudavam no
    // meio da leitura e desciam colados uns nos outros. `opacity` nao tem esse
    // efeito - cria contexto de empilhamento, nao bloco de contencao - entao
    // quem tem grude dentro recua so apagando.
    // A busca e nos CANDIDATOS, nao em `*`. Varrer todo descendente custava um
    // `getComputedStyle` por elemento da pagina inteira, umas 400 resolucoes de
    // estilo sincronas no instante em que a hidratacao acaba, que e o pior
    // instante possivel.
    const temGrude = temAlgoGrudado(conteudo);

    const recuo = {
      opacity: [1, 0.24],
      // `in(2)`, e nao `linear`. A janela e uma tela inteira de rolagem, e no
      // comeco dela a secao seguinte ainda esta quase toda fora de vista: com
      // curva reta a camada de baixo ja apagou um terco enquanto nada aparente
      // a cobria, e o efeito lia como a pagina desbotando sozinha. Carregando
      // o recuo para o fim, ele acontece quando a cobertura acontece.
      ease: "in(2)",
      autoplay: onScroll({
        target: seguinte,
        enter: "bottom top",
        leave: "top top",
        sync: 0.3,
      }),
    };

    // A chave nao entra no objeto. `scale: 1` nao e o mesmo que nao ter escala:
    // a biblioteca escreve `transform: scale(1)` do mesmo jeito, e para o
    // `sticky` de dentro a matriz identidade quebra igual.
    if (!temGrude) recuo.scale = [1, 0.92];

    animate(conteudo, recuo);
  }
}

/**
 * Inercia de rolagem: a roda do mouse nao move a pagina direto, ela desloca
 * um ALVO, e a posicao real persegue o alvo com atraso (lerp por quadro). E a
 * sensacao de peso da engenharia reversa do Locomotive, sem a dependencia
 * (Lenis custaria KB novos contra o teto de 120 do RNF-L04, para o mesmo
 * efeito que dez linhas de rAF já dão).
 *
 * So ouve `wheel`: em touch o sistema operacional ja da o proprio momentum, e
 * ouvir tambem ai duplicaria a inercia em vez de soma-la. Scroll por teclado,
 * ancora (`#hash`, o `html { scroll-behavior: smooth }` de base.css) ou barra
 * de rolagem continuam nativos - o loop so assume a posicao quando ELE proprio
 * esta em curso; parado, cada `wheel` novo resincroniza o alvo com
 * `window.scrollY` antes de somar o delta.
 *
 * `behavior: "instant"` no `scrollTo` e obrigatorio, nao estetico: com o
 * `scroll-behavior: smooth` do `html`, um `scrollTo` sem isso faz o proprio
 * navegador suavizar por cima do lerp e devolve leitura de posicao atrasada -
 * o mesmo defeito que ja custou um relato falso nesta base (ver checkpoint
 * da etapa E1).
 *
 * Expoe a velocidade em `--scroll-velocity` (px/quadro, no mesmo cravo do
 * nexxus) para a marquise inclinar com a rolagem - CSS puro consome, em
 * `.marquise` no `pagina.css`.
 */
export function ligarInerciaDeRolagem({ fator = 0.045 } = {}) {
  if (typeof window === "undefined" || semMovimento()) return () => {};

  let atual = window.scrollY;
  let alvo = atual;
  let animando = false;

  const limite = () => document.documentElement.scrollHeight - window.innerHeight;

  const passo = () => {
    const anterior = atual;
    atual += (alvo - atual) * fator;
    if (Math.abs(alvo - atual) < 0.5) atual = alvo;
    window.scrollTo({ top: atual, behavior: "instant" });

    // `style.setProperty`, nao `utils.set`: e um valor cru por quadro, sem
    // keyframe para o anime.js gerir, e `utils.set` nao escreve custom
    // property de verdade (so um expando na CSSStyleDeclaration, que o CSS
    // nunca le) - a mesma pegadinha do `style["--x"] = valor`.
    const v = Math.max(-18, Math.min(18, atual - anterior));
    document.documentElement.style.setProperty("--scroll-velocity", v.toFixed(2));

    if (atual !== alvo) {
      requestAnimationFrame(passo);
    } else {
      animando = false;
      document.documentElement.style.setProperty("--scroll-velocity", "0");
    }
  };

  const normalizarDelta = (e) => {
    // deltaMode 0 = pixel (mouse/trackpad, o caso comum), 1 = linha, 2 = pagina.
    if (e.deltaMode === 1) return e.deltaY * 16;
    if (e.deltaMode === 2) return e.deltaY * window.innerHeight;
    return e.deltaY;
  };

  const aoRolarRoda = (e) => {
    e.preventDefault();
    if (!animando) {
      atual = window.scrollY;
      alvo = atual;
    }
    alvo = Math.max(0, Math.min(limite(), alvo + normalizarDelta(e)));
    if (!animando) {
      animando = true;
      requestAnimationFrame(passo);
    }
  };

  const aoRolarExterno = () => {
    // Rolagem que nao veio do nosso proprio scrollTo (teclado, ancora, barra).
    // Enquanto o loop esta em curso o evento e ECO do nosso scrollTo: ignorar.
    if (animando) return;
    atual = window.scrollY;
    alvo = atual;
  };

  window.addEventListener("wheel", aoRolarRoda, { passive: false });
  window.addEventListener("scroll", aoRolarExterno, { passive: true });
  return () => {
    window.removeEventListener("wheel", aoRolarRoda);
    window.removeEventListener("scroll", aoRolarExterno);
    document.documentElement.style.removeProperty("--scroll-velocity");
  };
}

/* -------------------------------------------------------------------------
   Interacao
   ------------------------------------------------------------------------- */

/** Resposta ao toque no botao. Um degrau: e confirmacao, nao animacao. */
export function pulsar(alvo) {
  if (!alvo || semMovimento()) return;
  animate(alvo, {
    scale: [1, 0.97, 1],
    duration: duracao("--motion-fast"),
    ease: steps(2),
  });
}

/** Abre e fecha uma objecao pela altura real do conteudo. */
export function alternarAltura(alvo, aberto) {
  if (!alvo) return;
  const reduzido = semMovimento();
  return animate(alvo, {
    height: aberto ? alvo.scrollHeight : 0,
    opacity: aberto ? 1 : 0,
    duration: reduzido ? duracao("--motion-fast") : duracao("--motion-base"),
    ease: reduzido ? "linear" : EXPO,
    onComplete: () => {
      // Altura fixa quebraria o zoom de texto a 200% (RNF-L12).
      if (aberto) alvo.style.height = "auto";
    },
  });
}

/**
 * A entrada de um painel de tela cheia: a dobra e o fechamento.
 *
 * A ordem e a leitura: primeiro a moldura desenha o campo, depois os fios
 * abrem a grade, depois o titulo sobe de dentro do recorte, e so entao a
 * promessa e o botao. Cada peca espera a anterior porque a composicao e o
 * argumento - mostrar tudo de uma vez seria a mesma pagina sem hierarquia.
 *
 * `naRolagem` distingue os dois: a dobra ja esta na tela quando o JavaScript
 * acorda e comeca sozinha; o fechamento espera o visitante chegar.
 */
export function abrirPainel({
  moldura,
  fios,
  kicker,
  titulo,
  corpo,
  acao,
  rodape,
  seta,
  naRolagem = false,
}) {
  const reduzido = semMovimento();
  const passo = reduzido ? 0 : 1;

  // A ORDEM DAS CHAMADAS nao e a ordem que se ve: cada peca entra no seu
  // `atraso`, e a composicao esta nesses numeros. O que a ordem decide e outra
  // coisa, e ela custa caro na primeira tela.
  //
  // `revelar` e barato: marca o elemento e sai. `desenhar` mede o comprimento
  // de cada traco de SVG e `mascaraDeLinha` parte o titulo em linhas, e as
  // duas forcam layout na hora. Com elas na frente, o paragrafo da dobra (o
  // maior elemento da primeira tela, e portanto o que o LCP cronometra) so era
  // marcado depois de todo esse trabalho terminar, num aparelho onde o
  // processador ja e o gargalo.
  //
  // Barato primeiro, caro depois. A tela nao muda; o relogio, sim.
  revelar(kicker, { atraso: 120 * passo });
  revelar(corpo, { atraso: 780 * passo });
  revelar(acao, { atraso: 900 * passo });
  revelar(rodape, { atraso: 1020 * passo });
  desenhar(moldura, { naRolagem, atraso: 100 * passo });
  desenhar(fios, { naRolagem, atraso: 260 * passo, tempo: 620 });
  mascaraDeLinha(titulo, { atraso: 380 * passo });

  if (seta && !reduzido) {
    utils.set(seta, { opacity: 0 });
    const pisca = createTimeline({ delay: 1400, loop: true })
      .add(seta, { opacity: [0, 1], y: [0, 6], duration: 900, ease: "inOut(2)" })
      .add(seta, { opacity: [1, 0.35], y: [6, 0], duration: 900, ease: "inOut(2)" });
    return pausarForaDaTela(seta, pisca);
  }
}

/* -------------------------------------------------------------------------
   Rede de seguranca - RNF-L35
   ------------------------------------------------------------------------- */

/**
 * Se por qualquer motivo - observador que nao disparou, animacao interrompida
 * no meio, aba que ficou em segundo plano - algum elemento continuar invisivel
 * dentro da viewport, ele volta a aparecer. Uma pagina sem animacao vende; uma
 * pagina com paragrafo invisivel, nao.
 */
export function garantirVisibilidade(prazo = 2500) {
  if (typeof window === "undefined") return () => {};

  const varrer = () => {
    for (const el of document.querySelectorAll("[data-revelar]")) {
      const caixa = el.getBoundingClientRect();
      const dentro = caixa.top < window.innerHeight && caixa.bottom > 0;
      if (dentro && parseFloat(getComputedStyle(el).opacity) < 0.99) {
        utils.set(el, { opacity: 1, y: 0 });
      }
      // Linha de mascara que ficou fora do recorte tambem e texto invisivel.
      // `[data-line]`, e nao `.line`: o `splitText` do anime.js 4 marca cada
      // linha por atributo, e nao por classe. Com o seletor errado esta metade
      // da rede do RNF-L35 nunca casava com nada, e o furo era justamente o
      // pior caso: o pai fica em `opacity: 1`, entao a checagem de cima passa,
      // enquanto as linhas continuam paradas em `y: 110%`, fora do recorte. O
      // titulo some e a rede relata que esta tudo bem.
      for (const linha of el.querySelectorAll("[data-line]")) {
        const t = getComputedStyle(linha).transform;
        if (t && t !== "none" && !t.endsWith(", 0)")) utils.set(linha, { y: "0%" });
      }
    }
  };

  let relogio = setTimeout(varrer, prazo);
  const aoRolar = () => {
    clearTimeout(relogio);
    relogio = setTimeout(varrer, prazo);
  };

  window.addEventListener("scroll", aoRolar, { passive: true });
  return () => {
    clearTimeout(relogio);
    window.removeEventListener("scroll", aoRolar);
  };
}
