import { useEffect, useRef } from "react";
import { CampoDePontos } from "../components/CampoDePontos.jsx";
import { Rotulo } from "../components/Rotulo.jsx";
import { mascaraDeLinha, revelar, revelarEmCascata } from "../motion/index.js";

/**
 * O que voce leva, na forma da secao "Members' Words" do Rep Republic.
 *
 * Lida ao vivo em 06/09/2026: a cabeca fica CENTRADA e GRUDADA no meio da
 * tela (rotulo, titulo grande, subtitulo) e os cards passam por cima dela ao
 * rolar - em ziguezague de tres colunas no monitor (esquerda, direita,
 * centro) e empilhados no celular - alternando card escuro com textura e card
 * claro. Anatomia do card: glifo de aspas no acento, a frase grande, nome,
 * cidade, fio e etiqueta no pe.
 *
 * Aqui nao ha depoimento, e nenhum e inventado: a "fala" de cada card e o
 * beneficio, na voz do parceiro de treino; o "nome" e o termo-marca do
 * glossario (§5 do manual-de-voz), escrito sempre da mesma forma; a "cidade"
 * e o que aquele termo governa; e a etiqueta diz onde ele vive dentro do
 * protocolo, sem numero de capitulo, que a landing nao tem autoridade para
 * fixar (RF-L11a). O nome do sistema de retomada continua fora da capa, pela
 * trava do glossario.
 *
 * Os cards alternam tema pelo proprio atributo: a secao e Sigilo, e os pares
 * levam `data-theme="cartaz"`. E o unico lugar da pagina em que os dois temas
 * convivem na mesma tela, e e o que reproduz a alternancia do site de origem
 * sem fotografia.
 *
 * O campo de pontos ao fundo e o mesmo da prova (07/09/2026), e vale a mesma
 * ressalva: ele esbarra no `TR-03` e a decisao esta na §6 do contrato. Os
 * cards tem superficie opaca propria, entao nenhum texto corrido cai sobre a
 * malha - o que sobra por cima dela e a cabeca, em escala de titulo, e a
 * propria malha e tratamento de 1 bit, que e o que o `TR-07` pede por baixo
 * de texto.
 */
const VOZES = [
  {
    fala: "Você para de perguntar se sobe o peso. Bateu 12 boas em todas as séries, sobe. Acabou o achismo.",
    nome: "A Regra do 12",
    governa: "Progressão",
    onde: "no capítulo do programa",
  },
  {
    fala: "Faltou uma semana? O protocolo já sabe o que você faz na próxima sessão. A quebra está prevista, não punida.",
    nome: "O plano de retorno",
    governa: "Retomada",
    onde: "no capítulo da retomada",
  },
  {
    fala: "A unidade é a semana, nunca a sequência de dias. Uma amarela é dado do processo, não veredito sobre você.",
    nome: "Semana verde, semana amarela",
    governa: "Unidade de medida",
    onde: "em todo o protocolo",
  },
  {
    fala: "Você troca de exercício quando executa bem, não quando o mês virou. Quem libera é a ficha.",
    nome: "Portão da fase 3",
    governa: "Troca de exercício",
    onde: "na passagem para a fase 3",
  },
  {
    fala: "Sete anexos pra abrir no celular dentro da academia: ficha de treino, tabela de retorno e o resto que se usa de verdade.",
    nome: "O Kit",
    governa: "Ferramentas",
    onde: "nos sete anexos",
  },
  {
    fala: "Três sessões obrigatórias e uma opcional, de 60 a 75 minutos. Cabe numa rotina de estágio de seis horas por dia.",
    nome: "Quatro a cinco horas por semana",
    governa: "Rotina",
    onde: "na semana de treino",
  },
];

export function Leva() {
  const raiz = useRef(null);

  useEffect(() => {
    const no = raiz.current;
    if (!no) return;
    revelar(no.querySelector(".rotulo"));
    mascaraDeLinha(no.querySelector(".titulo"), { atraso: 60 });
    revelar(no.querySelector(".leva__sub"), { atraso: 200 });
    revelarEmCascata(no.querySelectorAll(".voz"), { intervalo: 80 });
  }, []);

  return (
    <section id="o-que-e" className="bloco leva" ref={raiz}>
      <CampoDePontos />

      <div className="envelope leva__palco">
        <header className="leva__cabeca">
          <Rotulo>o que você leva pra academia</Rotulo>
          <h2 className="titulo display" data-revelar>
            Seis coisas. Nenhuma depende de motivação.
          </h2>
          <p className="leva__sub body prosa" data-revelar>
            Cada uma tem nome, e o nome é o que você procura dentro do protocolo quando a semana
            aperta.
          </p>
        </header>

        <ol className="vozes">
          {VOZES.map((voz, indice) => {
            const claro = indice % 2 === 1;
            return (
              <li
                className={`voz${claro ? "" : " grao"}`}
                key={voz.nome}
                data-theme={claro ? "cartaz" : undefined}
                data-revelar
              >
                <span className="voz__aspas h1" aria-hidden="true">
                  &ldquo;
                </span>
                <p className="voz__fala h3">{voz.fala}</p>
                <p className="voz__quem">
                  <span className="voz__nome label">{voz.nome}</span>
                  <span className="voz__governa caption">{voz.governa}</span>
                </p>
                <span className="voz__onde mono-reg" data-num>
                  [{String(indice + 1).padStart(2, "0")} · {voz.onde}]
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
