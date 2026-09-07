import { useEffect, useRef, useState } from "react";
import "lenis/dist/lenis.css";
import "./styles/tokens/cor.css";
import "./styles/tokens/forma-espaco.css";
import "./styles/tokens/movimento.css";
import "./styles/tokens/tipografia.css";
import "./styles/fontes.css";
import "./styles/base.css";
import "./styles/pagina.css";

import { Consentimento } from "./components/Consentimento.jsx";
import { Doca } from "./components/Doca.jsx";
import { Intro } from "./components/Intro.jsx";
import { IndiceFixo } from "./components/IndiceFixo.jsx";
import { Marquise } from "./components/Marquise.jsx";
import { Dobra } from "./sections/Dobra.jsx";
import { Manifesto } from "./sections/Manifesto.jsx";
import { Espelho } from "./sections/Espelho.jsx";
import { Leva } from "./sections/Leva.jsx";
import { Semanas } from "./sections/Semanas.jsx";
import { Prova } from "./sections/Prova.jsx";
import { Amostra } from "./sections/Amostra.jsx";
import { Oferta } from "./sections/Oferta.jsx";
import { Garantia } from "./sections/Garantia.jsx";
import { Objecoes } from "./sections/Objecoes.jsx";
import { Fechamento } from "./sections/Fechamento.jsx";
import { RodapeLegal } from "./sections/RodapeLegal.jsx";

import { capturarParametros, observarProfundidade } from "./instrumentacao.js";
import { garantirVisibilidade, ligarLenis } from "./motion/index.js";
import { config } from "./config.js";

/**
 * A sequencia canonica do RF-L08, nesta ordem. Secao pode ser omitida com
 * justificativa; a ORDEM nao se reordena, porque a sequencia e o argumento.
 *
 * O que a versao 6 mudou (06/09/2026) foi a FORMA de cada secao, nao a ordem.
 * A v5 vestia todas com a mesma caixa - kicker, titulo, envelope - e tres
 * delas com o mesmo capitulo travado; a pagina lia como um so componente
 * repetido nove vezes. Agora cada secao e um desenho proprio, tirado das
 * cinco engenharias reversas de `02-fluor/reversos/`:
 *
 *     01 dobra          Sigilo   headline de duas linhas como arquitetura
 *     02 reconhecimento Sigilo   manifesto palavra a palavra, ligado a rolagem
 *     ---- marquise ----
 *     03 espelho        Cartaz   hoje / com o protocolo, linha a linha
 *     04 o que leva     Sigilo   cabeca grudada no centro, cards em ziguezague, temas alternando
 *     05 doze semanas   Sigilo   painel travado com odometro de semana
 *     06 prova          Sigilo   tres statements e a regua
 *     07 oferta         Cartaz   recibo com preco fatiado
 *     08 garantia       Cartaz   selo carimbado
 *     09 objecoes       Sigilo   dialogo
 *     10 fechamento     Sigilo   segunda capa, com a marquise do verbo
 *
 * Os temas continuam alternando, e a troca continua sendo no limite da
 * secao, em corte (RNF-L19). O botao aparece seis vezes mais a doca, sempre
 * com o mesmo verbo (RF-L10), nunca duas vezes na mesma tela.
 */
const SECOES = [
  "inicio",
  "reconhecimento",
  "espelho",
  "o-que-e",
  "mapa",
  "prova",
  "oferta",
  "garantia",
  "objecoes",
  "fechamento",
];

export function App() {
  const [params, definirParams] = useState({});
  const pilha = useRef(null);

  useEffect(() => {
    definirParams(capturarParametros());
    const pararProfundidade = observarProfundidade();
    const pararRede = garantirVisibilidade();
    const pararLenis = ligarLenis();
    return () => {
      pararProfundidade();
      pararRede();
      pararLenis();
    };
  }, []);

  return (
    <>
      <Intro />

      <a className="pular label" href="#espelho">
        Pular para o conteúdo
      </a>

      <main ref={pilha}>
        <Dobra params={params} />
        <Manifesto />

        <Marquise
          palavras={["Natural cresce", "Regra do 12", "12 semanas", "3 sessões", "Pix à vista"]}
          sentido={-1}
        />

        <Espelho params={params} />
        <Leva />
        <Semanas params={params} />
        <Prova params={params} />
        {config.mostrarAmostra && <Amostra />}
        <Oferta params={params} />
        <Garantia />
        <Objecoes />
        <Fechamento params={params} />
      </main>

      <RodapeLegal params={params} />
      <IndiceFixo ids={SECOES} />
      <Doca params={params} />
      <Consentimento />
    </>
  );
}
