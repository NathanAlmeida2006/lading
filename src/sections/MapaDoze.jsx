import { useEffect, useRef } from "react";
import { Capitulo } from "../components/Capitulo.jsx";
import { acenderTrilha, empilharBlocos } from "../motion/index.js";

/**
 * O mapa das 12 semanas.
 *
 * Conteudo canonico, nao inventado: as tres fases sao as do §3.3 do capitulo 3
 * do draft de hipertrofia, e as 12 semanas com 3 sessoes obrigatorias mais 1
 * opcional sao o RF-T02. O portao da fase 3 e o do glossario de termos-marca:
 * competencia, nao calendario.
 *
 * A pagina inteira argumenta que o problema da persona e de REGUA. Este bloco
 * e a regua do outro lado: em vez de medir o teto, mede o caminho. E por isso
 * que ele merece ser a peca mais construida da pagina.
 *
 * Tres efeitos trabalham juntos aqui:
 *   - a trilha cinza vira vermelha conforme a secao passa (ligada a rolagem);
 *   - os blocos de fase grudam e se empilham, um cobrindo o outro;
 *   - o bloco coberto recua de escala e apaga, que e o parallax entre eles.
 */
const FASES = [
  {
    numero: 1,
    nome: "Aprender",
    semanas: "Semanas 1 e 2",
    de: 1,
    ate: 2,
    resumo: "2 séries por exercício, no topo da faixa da tabela, 3 repetições no tanque.",
    objetivo:
      "Técnica sólida e números de base anotados. Aqui você está calibrando o placar, não disputando ele.",
  },
  {
    numero: 2,
    nome: "Construir",
    semanas: "Semanas 3 a 8",
    de: 3,
    ate: 8,
    resumo: "Sobe para 3 séries, na faixa cheia, 1 a 2 no tanque.",
    objetivo:
      "A Regra do 12 assume o volante: a cada sessão ela decide se o peso sobe ou repete. É a fase em que os números começam a contar história.",
  },
  {
    numero: 3,
    nome: "Consolidar",
    semanas: "Semanas 9 a 12",
    de: 9,
    ate: 12,
    resumo: "Mesmas 3 séries, mesma faixa, mesma regra, com duas trocas planejadas.",
    objetivo:
      "As trocas não são variedade por tédio: são a formatura. E quem libera é o portão da fase 3, que olha a sua ficha, não o calendário. Não passou? Você fica onde está e repete o portão daqui a duas semanas.",
  },
];

const SEMANAS = Array.from({ length: 12 }, (_, i) => i + 1);

/**
 * A régua vertical. Uma camada só: o estado de cada semana é classe, não
 * recorte, porque recorte não sabe qual semana é a corrente.
 *
 * `aria-hidden` porque a informação já está escrita nos cartões de fase, em
 * texto. A trilha é a mesma coisa dita em forma, e repeti-la no leitor de tela
 * seria ler doze números soltos.
 */
function Trilha() {
  return (
    <ol className="trilha__semanas" aria-hidden="true">
      {SEMANAS.map((semana) => (
        <li className="trilha__semana" key={semana}>
          <span className="trilha__ponto" />
          <span className="trilha__numero mono-reg" data-num>
            {String(semana).padStart(2, "0")}
          </span>
        </li>
      ))}
    </ol>
  );
}

/**
 * O mapa, agora em capitulo de quatro paineis (secao 3.2 da especificacao).
 *
 * Os tres cartoes de fase continuam existindo e continuam se acumulando, mas
 * dentro do painel 01: eles sao o resumo do caminho, e os paineis 02 a 04 sao
 * cada fase por extenso mais o portao.
 *
 * A trilha das doze semanas fica no painel 01, junto dos cartoes, porque e la
 * que ela tem o que medir. Ela continua `aria-hidden`: a informacao ja esta
 * escrita nos cartoes, em texto, e ler doze numeros soltos nao ajuda ninguem.
 */
export function MapaDoze() {
  const raiz = useRef(null);

  useEffect(() => {
    const no = raiz.current;
    if (!no) return;
    // O terceiro argumento e o CONTEXTO de medida do progresso, e agora ele e o
    // proprio `no`: o ref saiu da <section> e passou a viver no `.mapa__corpo`,
    // dentro do painel 01. Escrever `no.querySelector(".mapa__corpo")` aqui
    // devolveria `null`, porque `no` JA E o `.mapa__corpo`, e a trilha nunca
    // acenderia.
    acenderTrilha(
      no.querySelector(".trilha__fio--vivo"),
      no.querySelectorAll(".trilha__semana"),
      no,
    );
    empilharBlocos(no.querySelectorAll(".fase"));
  }, []);

  const paineis = [
    {
      titulo: "O caminho inteiro",
      conteudo: (
        <>
          <div className="mapa__corpo" ref={raiz}>
            <div className="mapa__trilha">
              <div className="trilha">
                <span className="trilha__fio" aria-hidden="true" />
                <span className="trilha__fio trilha__fio--vivo" aria-hidden="true" />
                <Trilha />
              </div>
            </div>

            <ol className="mapa__fases">
              {FASES.map((fase, indice) => (
                <li className="fase" key={fase.numero} style={{ "--ordem": indice, zIndex: indice + 1 }}>
                  <article className="fase__cartao">
                    <span className="fase__marcador overline" data-num>
                      Fase {fase.numero} &middot; {fase.semanas}
                    </span>
                    <h4 className="fase__nome display">{fase.nome}</h4>
                    <p className="fase__resumo body prosa">{fase.resumo}</p>
                    <span className="fase__faixa mono-reg" aria-hidden="true" data-num>
                      {String(fase.de).padStart(2, "0")} &rarr; {String(fase.ate).padStart(2, "0")}
                    </span>
                  </article>
                </li>
              ))}
            </ol>
          </div>

          <p className="mapa__rodape body prosa">
            Três sessões obrigatórias por semana, mais uma opcional, de 60 a 75 minutos.
            Nada acima de quatro, em nenhuma variação.
          </p>
        </>
      ),
    },
    ...FASES.map((fase) => ({
      titulo: `Fase ${fase.numero} · ${fase.nome}`,
      conteudo: (
        <>
          <span className="overline fase__marcador" data-num>{fase.semanas}</span>
          <p className="body-lg prosa">{fase.resumo}</p>
          <p className="body prosa fase__objetivo">{fase.objetivo}</p>
        </>
      ),
    })),
  ];

  return (
    <Capitulo
      id="mapa"
      indice={4}
      kicker="O caminho"
      titulo="Doze semanas, três fases"
      paineis={paineis}
    />
  );
}
