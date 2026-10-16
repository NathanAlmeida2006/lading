import { Botao } from "../components/Botao.jsx";
import { Fio } from "../components/Fio.jsx";
import { FundoCapa } from "../components/FundoCapa.jsx";
import { Menu } from "../components/Menu.jsx";
import { Moldura } from "../components/Moldura.jsx";
import { Rotulo } from "../components/Rotulo.jsx";
import { Wordmark } from "../components/Wordmark.jsx";
import { conteudo } from "../conteudo.js";
import { camada, crus, envelope, grao, linha, painel, vazado } from "../ui.js";

/**
 * A dobra, em painel de tela cheia.
 *
 * A headline e TIPOGRAFIA COMO ARQUITETURA, que e a licao do Rep Republic: duas
 * linhas compostas a mao, encostando nas bordas do container, a segunda so em
 * contorno de fio. Nao e tamanho de texto, e cartaz - e por isso a escala
 * `display-xxl` existe so aqui e no fechamento.
 *
 * O que compoe o resto e so o que ja e do sistema: kit de molduras e cantos,
 * fios de 1px como grade, grao, e numeros crus como ornamento honesto. Nenhum
 * sigilo, porque os tres do RF-G03 ainda nao existem na base.
 *
 * `min-h-svh` e nao `vh`: no celular a barra do navegador entra e sai, e `vh`
 * mede a viewport grande - o botao cairia para fora da tela justamente em quem
 * chega pelo anuncio (RF-L09).
 */
/**
 * A entrada e toda CSS (styles/residual.css, secao 7): kicker, corpo, acao e rodape
 * entram em `steps(2)`, as linhas da headline sobem em expo-out, os fios e os cantos se
 * desenham, e a seta pulsa. O heroi compoe DEBAIXO da cortina e ja esta parado quando ela
 * levanta, como no site de origem; `pendente:[--base:300ms]` empurra tudo 300 ms enquanto
 * a cortina cobre a tela. Nada aqui espera o pacote de JavaScript, e e por isso que o LCP
 * (RNF-L01) nao depende da hidratacao.
 */
const ENTRA = "animate-revelar motion-reduce:animate-none";
const [antesDoDado, depoisDoDado] = conteudo.dobra.subheadline.texto.split("foi medido");

export function Dobra({ params }) {
  return (
    <section className={`${painel} ${grao} painel-capa pendente:[--base:300ms]`} id="inicio">
      <FundoCapa />
      <Moldura entrada="css" />

      {/* Sem `z-1`: o menu inline (antes de hidratar) abre por `:target` e precisa competir com a pagina, nao com este contexto. */}
      <div className={`${envelope} flex-none flex items-center justify-between gap-4 text-silver relative`}>
        <Wordmark />
        <Menu />
      </div>

      <div className={`${envelope} flex-1 flex flex-col justify-center items-start gap-2 tela-rasa:gap-1 pt-3 tela-rasa:pt-1 pb-12 relative z-1`}>
        <Rotulo className={`painel__kicker ${ENTRA}`} margem="mb-2 tela-rasa:mb-1">hipertrofia · natural</Rotulo>

        <Fio atraso={260} />
        <h1
          className="painel__titulo flex flex-col w-full my-2 tela-rasa:my-1 break-words text-bone font-secundaria text-display-xxl uppercase tabular-nums tela-baixa:text-[length:clamp(56px,20vw,120px)]"
        >
          <span className={linha}>
            <span className={`linha__texto block ${camada} animate-subir motion-reduce:animate-none`}>{conteudo.dobra.headline.linhas[0]}</span>
          </span>{" "}
          <span className={linha}>
            <span className={`linha__texto block ${camada} ${vazado} animate-subir motion-reduce:animate-none [--atraso:60ms]`}>{conteudo.dobra.headline.linhas[1]}</span>
          </span>
        </h1>
        <Fio atraso={320} />

        <p className={`painel__corpo max-w-prose mt-3 tela-rasa:mt-2 text-silver font-terciaria text-[length:1.125rem] leading-[1.65] ${ENTRA}`}>
          {depoisDoDado === undefined
            ? conteudo.dobra.subheadline.texto
            : <>{antesDoDado}<strong className="text-bone font-semibold">foi medido</strong>{depoisDoDado}</>}
        </p>

        <div className={`painel__acao w-full shrink-0 mt-4 tela-rasa:mt-2 ${ENTRA} [--atraso:80ms]`}>
          <Botao params={params} posicao="dobra" />
          <p className="mt-3 text-silver font-terciaria text-mono-reg tabular-nums">
            {conteudo.mecanismo.semanas} semanas · condições na oferta abaixo
          </p>
        </div>
      </div>

      <div className={`${envelope} painel__rodape absolute inset-x-0 bottom-4 z-1 flex items-end justify-between gap-4 text-silver tela-rasa:hidden ${ENTRA} [--atraso:160ms]`}>
        <span className="flex flex-col gap-0.5 text-silver font-secundaria text-overline uppercase" aria-hidden="true">
          <span>rolar</span>
          <span>pra ver</span>
          <span className="block mt-1 text-silver font-terciaria text-[18px] leading-none animate-seta motion-reduce:animate-none">&#8595;</span>
        </span>
        <ul className={crus} role="list">
          <li>
            <b className="text-bone font-bold">{conteudo.mecanismo.semanas}</b> semanas
          </li>
          <li>
            <b className="text-bone font-bold">{conteudo.mecanismo.sessoesObrigatorias}</b> sessões por semana
          </li>
          <li>
            <b className="text-bone font-bold">{conteudo.mecanismo.sessoesOpcionais}</b> opcional
          </li>
        </ul>
      </div>
    </section>
  );
}
