import { Capitulo } from "../components/Capitulo.jsx";
import { Regua } from "../components/Regua.jsx";

/**
 * A prova, em capitulo de quatro paineis (secao 3.3 da especificacao).
 *
 * Lastro: dossie-hipertrofia, o achado de Kouri e colaboradores (1995) sobre o
 * teto natural, e o de Damas e colaboradores (2016) sobre o que e musculo e o
 * que e inchaco de reparo nas primeiras semanas.
 *
 * Duas travas do angulo valem literalmente aqui:
 *
 *   1. Substancia so aparece como DADO COMPARATIVO. Nenhum composto, nenhuma
 *      dose, nenhuma fonte, e nada que soe promocional.
 *   2. Nenhum corpo, nenhum antes e depois, nenhum nome de pessoa real como
 *      alvo estetico (RF-L17). O alvo se descreve pelo arquetipo.
 *
 * E nenhum §: o leitor procura pelo nome, nunca pela coordenada (RF-L15).
 *
 * O painel 03 nasce vazio de propriedade e cheio de promessa: ele e o lugar do
 * simulador, que e a etapa E2. Ate la ele carrega a pergunta em texto, que ja
 * e argumento, e nao um espaco reservado.
 */
export function Prova() {
  const paineis = [
    {
      titulo: "O número",
      conteudo: (
        <>
          <p className="body-lg prosa">
            Em 1995, um grupo de pesquisadores mediu a massa livre de gordura de
            atletas <strong>livres de drogas</strong> e de quem usava. O índice
            dos naturais ficou praticamente todo em 25 ou abaixo, com média perto
            de 21,8. A faixa de 25 a 35 era ocupada por quem usava.
          </p>
          <Regua />
          <span className="fonte-citada mono-reg">
            Kouri e colaboradores, 1995
          </span>
        </>
      ),
    },
    {
      titulo: "O intervalo",
      conteudo: (
        <>
          <p className="body-lg prosa">
            O que dá para esperar de verdade: estudos que mediram massa magra em
            homens não treinados encontram algo em torno de{" "}
            <strong>1 a 1,6 kg em 10 a 12 semanas</strong>.
          </p>
          <p className="body prosa">
            Parte do que muda nas primeiras semanas nem é músculo novo, é inchaço
            de reparo. O crescimento de verdade aparece entre a terceira e a
            décima semana. É pouco comparado ao feed, e é exatamente o que a
            medida mostra.
          </p>
          <span className="fonte-citada mono-reg">
            Damas e colaboradores, 2016
          </span>
        </>
      ),
    },
    {
      titulo: "A régua honesta",
      conteudo: (
        <div id="regua-honesta">
          <p className="body-lg prosa">
            Essa faixa foi medida em quem nunca treinou com constância. Se esse
            não é o seu caso, o número muda, e nenhum estudo desta página mediu o
            seu.
          </p>
          <p className="body prosa">
            Dizer isso custa uma venda de vez em quando. Inventar um número custa
            a próxima.
          </p>
        </div>
      ),
    },
    {
      titulo: "A fonte",
      conteudo: (
        <>
          <p className="body prosa">
            O teto natural é real, e fica <strong>muito acima</strong> do corpo
            de quem nunca treinou de forma consistente. Dizer que existe um
            limite é o argumento, não a ressalva.
          </p>
          <p className="body prosa">
            &ldquo;Natural não cresce&rdquo; confunde <em>não fico igual a quem
            usa</em> com <em>não cresço</em>. As duas frases não são a mesma, e é
            a primeira que está te travando.
          </p>
          <span className="fonte-citada mono-reg">
            Kouri e colaboradores, 1995 &middot; Damas e colaboradores, 2016
            &middot; fontes completas dentro do protocolo
          </span>
        </>
      ),
    },
  ];

  return (
    <Capitulo
      id="prova"
      indice={5}
      kicker="A prova"
      titulo="Existe um teto. Ele foi medido."
      paineis={paineis}
      grao
    />
  );
}
