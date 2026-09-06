import { useEffect, useRef } from "react";
import { Secao } from "../components/Secao.jsx";
import { revelarEmCascata } from "../motion/index.js";

/**
 * Reconhecimento: a situacao do visitante, na frase dele.
 *
 * Sai direto do angulo teto-natural, que registra a contradicao entre o §9 da
 * persona (o mito "natural nao cresce") e o §2 (ele desconfia do fisico
 * hormonizado vendido como natural). As duas crencas nunca se encontraram.
 *
 * Parceiro, nunca juiz: nenhuma frase aqui culpa o leitor (mestre §9).
 */
const LINHAS = [
  "Você desconfia do shape do feed. E mede seu potencial por ele mesmo assim.",
  "Treina em ondas de duas a seis semanas. Falta um dia, o dia vira a semana, e a semana vira a desistência.",
  "No fundo acha que sem bomba não chega lá. É a conclusão certa a partir da régua errada.",
];

export function Reconhecimento() {
  const raiz = useRef(null);

  useEffect(() => {
    revelarEmCascata(raiz.current?.querySelectorAll(".marcas > li"));
  }, []);

  return (
    <Secao id="reconhecimento" indice={2} tema="sigilo" kicker="Onde você está" titulo="A régua é o problema">
      <div ref={raiz}>
        <ul className="marcas">
          {LINHAS.map((linha, indice) => (
            <li key={linha} data-revelar>
              <span className="marcas__indice mono-reg" data-num>
                {String(indice + 1).padStart(2, "0")}
              </span>
              <p className="body prosa">{linha}</p>
            </li>
          ))}
        </ul>
      </div>
    </Secao>
  );
}
