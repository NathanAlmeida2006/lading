import { useEffect, useRef } from "react";
import { Botao } from "../components/Botao.jsx";
import { CampoDePontos } from "../components/CampoDePontos.jsx";
import { Regua } from "../components/Regua.jsx";
import { Rotulo } from "../components/Rotulo.jsx";
import { acenderEmSequencia, carimbar, revelar } from "../motion/index.js";

/**
 * A prova, na forma do fecho do Google Cloud x Team USA.
 *
 * Lido ao vivo em 07/09/2026: o bloco fica pinado no meio da tela sobre um
 * campo de pontos animado, e o texto - grande, centrado, quebrado a mao -
 * acende PALAVRA A PALAVRA conforme a pagina desce, com a palavra da fronteira
 * no acento. Passado o texto, vem o CTA. Nada de fundo colorido: o campo e
 * monocromatico e a cor entra uma vez so.
 *
 * O campo de pontos esbarra no `TR-03`, que reprova "faisca ou particula".
 * A decisao esta em aberto no contrato, e o componente vive isolado em
 * `CampoDePontos.jsx` justamente para poder sair numa linha. Ver o comentario
 * de la.
 *
 * O CONTEUDO nao mudou, e nao podia mudar: e ele que sustenta a pagina.
 * Lastro: dossie-hipertrofia, o achado de Kouri e colaboradores (1995) sobre o
 * teto natural e o de Damas e colaboradores (2016) sobre o que e musculo e o
 * que e inchaco de reparo. Toda alegacao continua vindo com o seu limite.
 *
 * Duas travas do angulo valem literalmente aqui: substancia so como DADO
 * COMPARATIVO, sem composto, dose ou fonte; e nenhum corpo, nenhum antes e
 * depois, nenhum nome de pessoa real (RF-L17). O alvo e a regua.
 */
const STATEMENT =
  "Existe um teto pra quem não usa nada. Ele fica muito acima de quem nunca treinou " +
  "com constância. E ele não é opinião: foi medido, tem autor e tem ano.";

export function Prova({ params }) {
  const raiz = useRef(null);
  const palco = useRef(null);

  useEffect(() => {
    const no = raiz.current;
    if (!no) return;
    const anim = acenderEmSequencia(no.querySelectorAll(".palavra"), palco.current, {
      classeAtual: "palavra--atual",
    });
    revelar(no.querySelector(".rotulo"));
    carimbar(no.querySelector(".intervalo__numero"), { naRolagem: true });
    for (const el of no.querySelectorAll(".prova__nota, .intervalo__texto, .honesta, .chamada")) {
      revelar(el);
    }
    return () => anim?.revert?.();
  }, []);

  return (
    <section id="prova" className="bloco prova" ref={raiz}>
      <CampoDePontos />

      <div className="prova__palco" ref={palco}>
        <div className="prova__fixo envelope">
          <Rotulo>a prova</Rotulo>
          <p className="prova__statement display">
            {STATEMENT.split(" ").map((palavra, indice) => (
              <span key={`${palavra}-${indice}`}>
                <span className="palavra">{palavra}</span>{" "}
              </span>
            ))}
          </p>
        </div>
      </div>

      <div className="envelope prova__corpo">
        <Regua />
        <p className="prova__nota caption prosa" data-revelar>
          Kouri e colaboradores, 1995. Entre atletas <strong>livres de drogas</strong>, o índice de
          massa livre de gordura ficou praticamente todo em 25 ou abaixo, com média perto de 21,8.
          A faixa de 25 a 35 era de quem usava.
        </p>

        <div className="intervalo">
          <p className="intervalo__numero display-xxl" data-num data-revelar>
            1 a 1,6 kg
          </p>
          <p className="intervalo__texto body-lg prosa" data-revelar>
            de massa magra em <strong>10 a 12 semanas</strong>, em homens que não treinavam. Parte
            do que muda nas primeiras semanas nem é músculo novo, é inchaço de reparo. O músculo de
            verdade aparece entre a terceira e a décima semana.
          </p>
          <span className="prova__nota caption" data-revelar>
            Damas e colaboradores, 2016.
          </span>

          <blockquote className="honesta" data-revelar>
            <p className="body-lg prosa">
              Essa faixa foi medida em quem nunca treinou com constância. Se esse não é o seu caso,
              o número muda, e nenhum estudo desta página mediu o seu.
            </p>
            <p className="body prosa">
              Dizer isso custa uma venda de vez em quando. Inventar um número custa a próxima.
            </p>
          </blockquote>

          <div className="chamada" data-revelar>
            <Botao params={params} posicao="prova" />
            <span className="microregistro mono-reg">
              Fontes completas, com autor e ano, dentro do protocolo.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
