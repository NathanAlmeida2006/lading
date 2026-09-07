import { useEffect, useRef } from "react";
import { Botao } from "../components/Botao.jsx";
import { Rotulo } from "../components/Rotulo.jsx";
import { mascaraDeLinha, revelar, revelarEmCascata } from "../motion/index.js";

/**
 * O espelho, em baralho de cards: a secao "Find Your Program" do Rep Republic.
 *
 * Lida ao vivo em 06/09/2026: cabeca grudada a esquerda (rotulo, titulo grande,
 * subtitulo) e, a direita, cinco cards numerados que GRUDAM e se acumulam ao
 * rolar, cada um num degrau abaixo do anterior, deixando a faixa do indice dos
 * cobertos a mostra. Anatomia do card: indice no acento, titulo grande,
 * descricao, linha de metadados, fio, e um rodape com prova a esquerda e o
 * botao a direita.
 *
 * O conteudo continua sendo o espelho do Kora: cada card troca uma regua. O
 * "hoje" virou a linha de metadados, riscado; o lastro ocupa o lugar das
 * estrelas, porque prova aqui e autor e ano, nao avaliacao; e o botao de cada
 * card e o mesmo verbo da pagina (RF-L10), em contorno, para o acento da
 * superficie continuar sendo um so: o indice.
 *
 * Nenhum card promete corpo. Promete comportamento e medida, que e o que o
 * protocolo entrega e o que o RF-L35 permite prometer sem intervalo.
 */
const CARTAS = [
  {
    titulo: "Troca a régua",
    depois: "Mede pelo teto natural, que tem número, autor e ano.",
    hoje: "Mede o potencial pelo shape do feed.",
    lastro: "Kouri e colaboradores, 1995",
  },
  {
    titulo: "Troca a onda pela semana",
    depois: "Treina três vezes por semana, doze semanas seguidas, com a semana como unidade.",
    hoje: "Treina em ondas de duas a seis semanas.",
    lastro: "12 semanas · 3 sessões por semana",
  },
  {
    titulo: "Troca o achismo pela regra",
    depois: "Sobe o peso quando bate 12 boas. A Regra do 12 decide, não o humor do dia.",
    hoje: "Troca o treino toda vez que o resultado demora.",
    lastro: "Progressão sem planilha",
  },
  {
    titulo: "Troca a desistência pelo retorno",
    depois: "Falta um dia, e o plano de retorno já diz o que fazer na próxima sessão.",
    hoje: "Falta um dia, o dia vira a semana, a semana vira desistência.",
    lastro: "A perda mensurável leva semanas, não dias",
  },
  {
    titulo: "Troca o mito pelo número",
    depois: "Sabe onde fica o teto de quem não usa nada, e quanto falta pra ele.",
    hoje: "Acha que sem bomba não chega lá.",
    lastro: "Índice em 25 ou abaixo, média 21,8",
  },
];

export function Espelho({ params }) {
  const raiz = useRef(null);

  useEffect(() => {
    const no = raiz.current;
    if (!no) return;
    revelar(no.querySelector(".rotulo"));
    mascaraDeLinha(no.querySelector(".titulo"), { atraso: 60 });
    revelar(no.querySelector(".espelho__sub"), { atraso: 200 });
    revelarEmCascata(no.querySelectorAll(".carta"), { intervalo: 80 });
  }, []);

  return (
    <section id="espelho" className="bloco espelho" data-theme="cartaz" ref={raiz}>
      <div className="envelope espelho__grade">
        <header className="espelho__cabeca">
          <Rotulo>a troca de régua</Rotulo>
          <h2 className="titulo h1" data-revelar>
            O que muda quando a régua muda
          </h2>
          <p className="espelho__sub body prosa" data-revelar>
            Cinco trocas. Nenhuma pede motivação: pedem uma régua que tem número, e um plano que
            já conta com a semana que falha.
          </p>
        </header>

        <ol className="baralho">
          {CARTAS.map((carta, indice) => (
            <li className="carta" key={carta.titulo} style={{ "--ordem": indice }} data-revelar>
              <span className="carta__indice mono-reg" data-num>
                {String(indice + 1).padStart(2, "0")}
              </span>
              <h3 className="carta__titulo h1">{carta.titulo}</h3>
              <p className="carta__depois body-lg prosa">{carta.depois}</p>
              <p className="carta__hoje body">
                <span className="carta__hoje-rotulo overline">hoje</span> <s>{carta.hoje}</s>
              </p>
              <div className="carta__rodape">
                <span className="carta__lastro mono-reg" data-num>
                  [{carta.lastro}]
                </span>
                <Botao params={params} posicao={`espelho-${indice + 1}`} compacto fantasma />
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
