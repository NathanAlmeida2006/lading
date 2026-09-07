import { useEffect, useRef } from "react";
import { CampoDePontos } from "../components/CampoDePontos.jsx";
import { Rotulo } from "../components/Rotulo.jsx";
import { mascaraDeLinha, revelar, revelarEmCascata } from "../motion/index.js";

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

  useEffect(() => {
    const no = raiz.current;
    if (!no) return;
    revelar(no.querySelector(".rotulo"));
    mascaraDeLinha(no.querySelector(".titulo"), { atraso: 60 });
    revelarEmCascata(no.querySelectorAll(".dialogo > *"), { intervalo: 90 });
  }, []);

  return (
    <section id="objecoes" className="bloco objecoes" ref={raiz}>
      <CampoDePontos variante="fiel" />

      <div className="envelope">
        <header className="objecoes__cabeca">
          <Rotulo>o que você está pensando</Rotulo>
          <h2 className="titulo h1" data-revelar>
            As três perguntas
          </h2>
        </header>

        <dl className="dialogo">
          {OBJECOES.map(({ pergunta, resposta }) => (
            <Fala key={pergunta} pergunta={pergunta} resposta={resposta} />
          ))}
        </dl>
      </div>
    </section>
  );
}

function Fala({ pergunta, resposta }) {
  return (
    <>
      <dt className="fala fala--deles" data-revelar>
        <span className="fala__aspas display-xxl" aria-hidden="true">
          &ldquo;
        </span>
        <span className="fala__texto h3">{pergunta}</span>
      </dt>
      <dd className="fala fala--nossa" data-revelar>
        <span className="fala__quem overline">parceiro de treino</span>
        <p className="body-lg prosa">{resposta}</p>
      </dd>
    </>
  );
}
