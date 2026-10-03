import { useRef } from "react";
import { CampoDePontos } from "../components/CampoDePontos.jsx";
import { Rotulo } from "../components/Rotulo.jsx";
import { mascaraDeLinha, revelar, revelarEmCascata, useMovimento } from "../motion/index.js";
import { bloco, envelope, mascara } from "../ui.js";

/**
 * Tres objecoes, teto rigido (RF-L11), em forma de conversa.
 *
 * A primeira sai do campo "Objecao principal" do angulo teto-natural. As duas
 * seguintes sao as objecoes de compra do §13 da persona: "mais um curso raso
 * de guru" e o medo de nao manter, que o §10 registra como historico real.
 *
 * A forma e dialogo, nao acordeao: a objecao vem na voz do visitante, com as
 * aspas gigantes do Nakula como marcador, e a resposta vem na voz do parceiro
 * de treino, do outro lado. Nada colapsado: resposta escondida e objecao nao
 * respondida.
 *
 * Ao fundo, a variante `fiel` do campo de pontos (07/09/2026): a nuvem em
 * perspectiva, que e a leitura mais proxima do site de origem. E a unica
 * secao com ela; a prova e o que se leva ficam na malha, mais barata. Vale a
 * mesma ressalva do `TR-03`, registrada na §6 do contrato.
 *
 * O campo fica atras de tudo; a resposta tem superficie propria, entao o
 * unico texto sobre a nuvem e a objecao, em escala de titulo.
 */
const OBJECOES = [
  {
    pergunta: "Então tem um teto e eu nunca vou ficar como o cara do feed.",
    resposta:
      "Tem, e ele fica muito acima de onde você está. O teto que trava não é o do seu corpo: é o do plano que nunca durou doze semanas seguidas.",
  },
  {
    pergunta: "É mais um curso raso de guru.",
    resposta:
      "Cada afirmação técnica tem autor e ano, e as fontes vão dentro do protocolo. Se um número não tem de onde veio, ele não entrou.",
  },
  {
    pergunta: "Eu não vou conseguir manter.",
    resposta:
      "O protocolo assume que você vai quebrar, porque todo mundo quebra. Por isso tem um capítulo só sobre voltar, e a unidade de medida é a semana, não a sequência de dias.",
  },
];

export function Objecoes() {
  const raiz = useRef(null);

  useMovimento(() => {
    const no = raiz.current;
    if (!no) return;
    revelar(no.querySelector(".rotulo"));
    mascaraDeLinha(no.querySelector(".titulo"), { atraso: 60 });
    revelarEmCascata(no.querySelectorAll(".dialogo > *"), { intervalo: 90 });
  }, []);

  return (
    <section id="objecoes" className={`${bloco} py-16 md:py-24`} ref={raiz}>
      <CampoDePontos variante="fiel" />

      <div className={`${envelope} relative z-1 lg:grid lg:grid-cols-[repeat(12,1fr)] lg:gap-x-8 lg:items-start`}>
        <header className="mb-8 lg:mb-0 lg:col-[1/span_4] lg:sticky lg:top-12">
          <Rotulo>o que você está pensando</Rotulo>
          <h2 className={`titulo text-bone font-secundaria text-h1 uppercase lg:text-display ${mascara}`} data-revelar>
            As três perguntas
          </h2>
        </header>

        <dl className="dialogo flex flex-col gap-6 m-0 lg:col-[6/-1]">
          {OBJECOES.map(({ pergunta, resposta }) => (
            <Fala key={pergunta} pergunta={pergunta} resposta={resposta} />
          ))}
        </dl>
      </div>
    </section>
  );
}

/**
 * A objecao, na voz do visitante: encostada a direita, com as aspas gigantes
 * por tras. A resposta, na voz do parceiro, encostada a esquerda.
 */
function Fala({ pergunta, resposta }) {
  return (
    <>
      <dt
        className="relative self-end max-w-[30ch] lg:max-w-[36ch] m-0 pt-8 pr-4 pb-4 pl-6 text-right text-silver"
        data-revelar
      >
        <span
          className="absolute -top-[0.05em] left-0 z-0 text-surface-2 pointer-events-none select-none font-secundaria font-extrabold uppercase tracking-[0.01em] leading-[0.8] tabular-nums text-[length:clamp(96px,30vw,200px)]"
          aria-hidden="true"
        >
          &ldquo;
        </span>
        <span className="relative z-1 block font-secundaria text-h3 lg:text-[24px] lg:leading-[1.15]">{pergunta}</span>
      </dt>
      <dd
        className="self-start max-w-[44ch] lg:max-w-[52ch] m-0 px-6 py-4 lg:px-8 lg:py-6 border-l-2 border-acento bg-surface-1"
        data-revelar
      >
        <span className="block mb-2 text-silver font-secundaria text-overline uppercase">parceiro de treino</span>
        <p className="max-w-prose font-terciaria text-body-lg">{resposta}</p>
      </dd>
    </>
  );
}
