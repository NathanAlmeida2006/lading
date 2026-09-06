import { Capitulo } from "../components/Capitulo.jsx";

/**
 * O protocolo como objeto concreto, nao como promessa.
 *
 * Os nomes usados aqui sao termos-marca do glossario (§5 do manual-de-voz) e
 * escrevem-se sempre da mesma forma, sem sinonimo. Um termo ficou de fora de
 * proposito: o nome do sistema de retomada vive DENTRO do capitulo 7 e nunca
 * na capa (trava do glossario, persona §13). A landing descreve o capitulo,
 * nao o batiza.
 */
const CARTOES = [
  {
    titulo: "A Regra do 12",
    corpo:
      "Bateu 12 repetições boas em todas as séries, sobe o peso. É a progressão inteira, sem planilha e sem achismo.",
  },
  {
    titulo: "O plano de retorno",
    corpo:
      "Faltou uma semana? Você repete a última semana concluída e volta com a carga reduzida num percentual fixo. O protocolo já conta com a quebra.",
  },
  {
    titulo: "Semana verde, semana amarela",
    corpo:
      "A unidade de medida é a semana, nunca a sequência de dias. Uma semana amarela é dado do processo, não veredito sobre você.",
  },
  {
    titulo: "Portão da fase 3",
    corpo:
      "Quem libera a troca de exercício é a competência, não o calendário. Você troca quando executa bem, e não quando o mês virou.",
  },
  {
    titulo: "O Kit",
    corpo:
      "Sete anexos nomeados: ficha de treino, tabela de retorno e o resto do que se usa dentro da academia, no celular.",
  },
  {
    titulo: "Três a quatro sessões",
    corpo:
      "Quatro a cinco horas por semana, que é o que cabe numa rotina de estágio de seis horas por dia.",
  },
];

/**
 * Os tres paineis vem da secao 3.1 da especificacao: o objeto, o dentro e o que
 * nao e. Os seis cartoes do catalogo moram no painel 02, que e o do "dentro".
 *
 * A revelacao em cascata dos cartoes saiu: dentro de um painel grudado ela
 * dispararia com o painel ja parado na tela, o que le como conteudo chegando
 * atrasado. O que revela agora e a chegada do proprio painel.
 */
export function OQueE() {
  const paineis = [
    {
      titulo: "O objeto",
      conteudo: (
        <>
          <p className="body-lg prosa">
            Um PDF e um EPUB, entregues por e-mail em minutos. Não é curso, não
            é grupo, não é assinatura: é um arquivo que fica com você.
          </p>
          <p className="body prosa">
            Dentro dele, o programa completo de doze semanas e os sete anexos do
            Kit, que é o que você abre no celular dentro da academia.
          </p>
        </>
      ),
    },
    {
      titulo: "O dentro",
      conteudo: (
        <ul className="cartoes">
          {CARTOES.map((cartao, indice) => (
            <li className="cartao" key={cartao.titulo}>
              <span className="cartao__indice mono-reg" aria-hidden="true" data-num>
                {String(indice + 1).padStart(2, "0")}
              </span>
              <h4 className="cartao__titulo h3">{cartao.titulo}</h4>
              <p className="cartao__corpo body prosa">{cartao.corpo}</p>
            </li>
          ))}
        </ul>
      ),
    },
    {
      titulo: "O que não é",
      conteudo: (
        <>
          <p className="body prosa">
            Não é dieta. O que você come tem protocolo próprio, e este aqui não
            se mete nisso.
          </p>
          <p className="body prosa">
            Não é suplemento, e não vende nenhum.
          </p>
          <p className="body prosa">
            E não é o treino de quem usa. O teto de um natural é outro, e a
            página inteira existe para dizer onde ele fica.
          </p>
        </>
      ),
    },
  ];

  return (
    <Capitulo
      id="o-que-e"
      indice={3}
      tema="cartaz"
      kicker="O que você leva"
      titulo="Um protocolo, não um feed"
      paineis={paineis}
    />
  );
}
