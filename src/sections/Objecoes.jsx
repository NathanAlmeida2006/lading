import { useEffect, useId, useRef, useState } from "react";
import { Secao } from "../components/Secao.jsx";
import { alternarAltura, revelarEmCascata } from "../motion/index.js";

/**
 * Tres objecoes, teto rigido (RF-L11). A quarta nao e resposta, e inseguranca
 * da pagina.
 *
 * A primeira sai do campo "Objecao principal" do angulo teto-natural. As duas
 * seguintes sao as objecoes de compra do §13 da persona: "mais um curso raso
 * de guru" e o medo de nao manter, que o §10 registra como historico real.
 */
const OBJECOES = [
  {
    pergunta: "Então tem um teto e eu nunca vou ficar como o cara do feed.",
    resposta:
      "Tem, e ele fica muito acima do que você tem hoje. O teto que está te travando não é o do seu corpo: é o do plano que você nunca seguiu por doze meses seguidos.",
  },
  {
    pergunta: "É mais um curso raso de guru.",
    resposta:
      "Cada afirmação técnica aqui tem autor e ano, e as fontes vão dentro do protocolo. Se um número não tiver de onde veio, ele não entrou.",
  },
  {
    pergunta: "Eu não vou conseguir manter.",
    resposta:
      "O protocolo assume que você vai quebrar, porque todo mundo quebra. Por isso ele tem um capítulo só sobre voltar, e a unidade de medida é a semana, não a sequência de dias.",
  },
];

function Objecao({ pergunta, resposta }) {
  const [aberto, definirAberto] = useState(false);
  const corpo = useRef(null);
  const id = useId();
  const primeiro = useRef(true);

  useEffect(() => {
    // Na montagem o corpo ja nasce fechado pelo estilo; animar aqui faria a
    // pagina piscar tres acordeoes na hidratacao.
    if (primeiro.current) {
      primeiro.current = false;
      return;
    }
    alternarAltura(corpo.current, aberto);
  }, [aberto]);

  return (
    <li className="objecao" data-revelar>
      <button
        type="button"
        className="objecao__botao h3"
        aria-expanded={aberto}
        aria-controls={id}
        onClick={() => definirAberto((valor) => !valor)}
      >
        {pergunta}
        <span className="objecao__sinal" aria-hidden="true">
          +
        </span>
      </button>
      <div
        id={id}
        className="objecao__corpo"
        ref={corpo}
        style={{ height: aberto ? "auto" : 0, opacity: aberto ? 1 : 0 }}
      >
        <p className="body prosa">{resposta}</p>
      </div>
    </li>
  );
}

export function Objecoes() {
  const raiz = useRef(null);

  useEffect(() => {
    revelarEmCascata(raiz.current?.querySelectorAll(".objecao"));
  }, []);

  return (
    <Secao id="objecoes" indice={8} tema="sigilo" kicker="O que você está pensando" titulo="As três perguntas">
      <ul ref={raiz}>
        {OBJECOES.map((objecao) => (
          <Objecao key={objecao.pergunta} {...objecao} />
        ))}
      </ul>
    </Secao>
  );
}
