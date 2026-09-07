import { useEffect, useRef } from "react";
import { Botao } from "../components/Botao.jsx";
import { Rotulo } from "../components/Rotulo.jsx";
import { acenderEmSequencia, revelar, revelarEmCascata, subirLinhas } from "../motion/index.js";

/**
 * As doze semanas, na forma da secao "Lenis runs the web" do lenis.dev.
 *
 * Lida ao vivo em 07/09/2026: um fio vertical a esquerda, o titulo gigante em
 * tres linhas quebradas a mao ao lado dele, e o paragrafo de tese deslocado
 * para a direita E para baixo, com um termo em acento no meio. Abaixo, a
 * grade de cards com capa, nome e legenda, em ziguezague vertical: nenhum
 * card alinha com o vizinho. Fecha com uma pergunta curta e o CTA.
 *
 * O que substitui o que: o odometro travado saiu. O numero grande dele nao
 * se perdeu, mudou de lugar - agora e a CAPA de cada card, que e o analogo do
 * preview de video do showcase. Um numero por card, cinco cards.
 *
 * Conteudo canonico, nao inventado (RF-L11a): as tres fases sao as do capitulo
 * do programa do draft de hipertrofia; as 12 semanas com 3 sessoes
 * obrigatorias e 1 opcional sao o RF-T02; o portao da fase 3 e o do glossario,
 * competencia e nao calendario. Cinco estados, nao doze.
 *
 * A regua das doze semanas continua acendendo e apagando com a posicao da
 * pagina (RF-L11b), agora no bloco do manifesto, onde ela e a linha do tempo
 * do plano inteiro. Sob movimento reduzido ela nasce inteira acesa, porque
 * informa o caminho e informacao nao depende de animacao.
 */
const SEMANAS = 12;

const ESTADOS = [
  {
    capa: "1e2",
    faixa: "semanas",
    nome: "Fase 1 · Aprender",
    texto: "Duas séries, topo da faixa, três repetições no tanque. Você calibra o placar antes de disputar ele.",
  },
  {
    capa: "3a8",
    faixa: "semanas",
    nome: "Fase 2 · Construir",
    texto:
      "Três séries, faixa cheia. A Regra do 12 decide quando o peso sobe. É onde os números começam a contar história.",
  },
  {
    capa: "05",
    faixa: "semana",
    nome: "A quarta sessão",
    texto: "Se as três obrigatórias estão acontecendo com folga, a quarta entra. Opcional, nunca cobrada.",
  },
  {
    capa: "09",
    faixa: "semana",
    nome: "O portão",
    texto:
      "O portão da fase 3 olha a sua ficha, não a data. Passou, troca. Não passou, repete daqui a duas semanas, sem drama.",
  },
  {
    capa: "9a12",
    faixa: "semanas",
    nome: "Fase 3 · Consolidar",
    texto: "Mesmas três séries, com duas trocas planejadas. Não é variedade por tédio: é a formatura.",
  },
];

const LINHAS = ["Doze semanas", "já estão", "escritas"];

export function Semanas({ params }) {
  const raiz = useRef(null);

  useEffect(() => {
    const no = raiz.current;
    if (!no) return;
    revelar(no.querySelector(".rotulo"));
    // `.linha` e `.linha__texto` sao o primitivo dos paineis, reusado: mesmo
    // recorte, mesma rede de seguranca do RNF-L35, mesma checagem no
    // `verificar`. Uma classe propria aqui ficaria fora das tres.
    // Mais rapido que o padrao, e a razao e de CONTEXTO, nao de gosto. O
    // padrao (820 ms com 110 ms de escalonamento) e o da dobra, onde a
    // headline abre a pagina junto da cortina e a cerimonia cabe. Aqui o
    // visitante ja esta rolando e olhando para o titulo: a ultima linha
    // fechava so depois de 1 s, acima do teto de 0,8 s que as engenharias
    // reversas fixam para movimento em interacao direta. 520 mais 60 poe o
    // fim em 640 ms.
    subirLinhas(no.querySelectorAll(".semanas__titulo .linha__texto"), {
      naRolagem: true,
      pai: no.querySelector(".semanas__titulo"),
      tempo: 520,
      intervalo: 60,
    });
    revelar(no.querySelector(".semanas__tese"), { atraso: 160 });
    const anim = acenderEmSequencia(no.querySelectorAll(".regua12__semana"), no, {
      classe: "regua12__semana--acesa",
    });
    revelarEmCascata(no.querySelectorAll(".slide"), { intervalo: 80 });
    revelar(no.querySelector(".semanas__mais"));
    return () => anim?.revert?.();
  }, []);

  return (
    <section id="mapa" className="bloco semanas" ref={raiz}>
      <div className="envelope">
        <Rotulo>as próximas doze semanas</Rotulo>

        <div className="semanas__manifesto">
          <h2 className="semanas__titulo display-xxl" data-revelar>
            {LINHAS.map((linha) => (
              <span className="linha" key={linha}>
                <span className="linha__texto">{linha}</span>
              </span>
            ))}
          </h2>

          <p className="semanas__tese body-lg" data-revelar>
            Três sessões por semana, mais uma opcional. A{" "}
            <strong className="semanas__marca">Regra do 12</strong> decide quando o peso sobe, o{" "}
            <strong className="semanas__marca">portão da fase 3</strong> decide quando o exercício
            muda, e nenhum dos dois pergunta como você está se sentindo hoje.
          </p>
        </div>

        <ol className="regua12" aria-hidden="true">
          {Array.from({ length: SEMANAS }, (_, i) => (
            <li className="regua12__semana" key={i}>
              <span className="regua12__ponto" />
              <span className="regua12__numero mono-reg" data-num>
                {String(i + 1).padStart(2, "0")}
              </span>
            </li>
          ))}
        </ol>

        <ol className="slides">
          {ESTADOS.map((estado) => (
            <li className="slide" key={estado.nome} data-revelar>
              <div className="slide__capa">
                <span className="slide__numero display-xxl" data-num aria-hidden="true">
                  {estado.capa}
                </span>
                <span className="slide__faixa overline">{estado.faixa}</span>
              </div>
              <h3 className="slide__nome h3">{estado.nome}</h3>
              <p className="slide__texto body prosa">{estado.texto}</p>
            </li>
          ))}
        </ol>

        <div className="semanas__mais" data-revelar>
          <p className="semanas__pergunta h2">A semana 1 começa no dia em que o arquivo chega.</p>
          <Botao params={params} posicao="mapa" />
        </div>
      </div>
    </section>
  );
}
