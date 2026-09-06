import { useEffect, useRef, useState } from "react";
import "./styles/tokens/cor.css";
import "./styles/tokens/forma-espaco.css";
import "./styles/tokens/movimento.css";
import "./styles/tokens/tipografia.css";
import "./styles/fontes.css";
import "./styles/base.css";
import "./styles/pagina.css";

import { Consentimento } from "./components/Consentimento.jsx";
import { IndiceFixo } from "./components/IndiceFixo.jsx";
import { Marquise } from "./components/Marquise.jsx";
import { Dobra } from "./sections/Dobra.jsx";
import { Reconhecimento } from "./sections/Reconhecimento.jsx";
import { OQueE } from "./sections/OQueE.jsx";
import { MapaDoze } from "./sections/MapaDoze.jsx";
import { Prova } from "./sections/Prova.jsx";
import { Amostra } from "./sections/Amostra.jsx";
import { Oferta } from "./sections/Oferta.jsx";
import { Garantia } from "./sections/Garantia.jsx";
import { Objecoes } from "./sections/Objecoes.jsx";
import { Fechamento } from "./sections/Fechamento.jsx";
import { RodapeLegal } from "./sections/RodapeLegal.jsx";

import { capturarParametros, observarProfundidade } from "./instrumentacao.js";
import {
  empilharSecoes,
  garantirVisibilidade,
  ligarInerciaDeRolagem,
  medirPilha,
} from "./motion/index.js";
import { config } from "./config.js";

/**
 * A sequencia canonica do RF-L08, nesta ordem. Secao pode ser omitida com
 * justificativa; a ORDEM nao se reordena, porque a sequencia e o argumento.
 *
 * O que a versao 2 acrescentou por cima dessa ordem foi RITMO.
 *
 * A pagina alterna blocos Sigilo e blocos Cartaz em vez de escolher um tema:
 *
 *     01 dobra          Sigilo    o problema comeca no escuro
 *     02 reconhecimento Sigilo
 *     ---- marquise ----
 *     03 o que e        Cartaz    o produto e o papel: catalogo, legivel
 *     ---- marquise ----
 *     04 prova          Sigilo    a medicao, onde a regua acende
 *     ---- marquise ----
 *     05 oferta         Cartaz    preco e garantia pedem luz
 *     06 garantia       Cartaz
 *     ---- marquise ----
 *     07 objecoes       Sigilo
 *     08 fechamento     Sigilo    fecha onde abriu
 *
 * O RNF-G18 exige que os dois temas sejam nativos e paritarios. Alternar e a
 * leitura mais literal disso, e resolve de brinde o problema que a versao 1
 * tinha: uma pagina inteira no escuro faz preco e garantia parecerem letra
 * miuda. As marquises sao a costura entre os blocos.
 */
const SECOES = [
  "inicio",
  "reconhecimento",
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
    const pararInercia = ligarInerciaDeRolagem();

    // As marquises ficam de fora de proposito: elas nao sao camada, sao a
    // costura entre duas, e passam por cima da que esta grudada.
    const camadas = pilha.current?.querySelectorAll(":scope > .secao, :scope > .painel");

    // Primeiro a altura (o ponto de grude), depois a profundidade. A segunda
    // mede a secao SEGUINTE de cada camada, e a primeira nao mexe em layout, so
    // no `top` - entao a ordem e por clareza, nao por dependencia.
    const pararMedida = medirPilha(camadas);
    empilharSecoes(camadas);

    return () => {
      pararProfundidade();
      pararRede();
      pararInercia();
      pararMedida();
    };
  }, []);

  return (
    <>
      <a className="pular label" href="#o-que-e">
        Pular para o conteúdo
      </a>

      <main ref={pilha}>
        <Dobra params={params} />
        <Reconhecimento />

        <Marquise
          palavras={["Regra do 12", "Portão da fase 3", "Semana verde", "O Kit"]}
          sentido={-1}
        />

        <OQueE />

        <Marquise
          palavras={["Semana 01", "Semana 06", "Semana 12", "Regra do 12"]}
          sentido={1}
          tempo={30000}
        />

        <MapaDoze />
        <Prova />
        {config.mostrarAmostra && <Amostra />}

        <Marquise
          palavras={["Protocolo 01", "Hipertrofia", "Lithium"]}
          sentido={-1}
          tempo={22000}
        />

        <Oferta params={params} />
        <Garantia />

        <Marquise
          palavras={["Natural cresce", "Regra do 12", "O Kit"]}
          sentido={1}
          tempo={28000}
        />

        <Objecoes />
        <Fechamento params={params} />
      </main>

      <RodapeLegal />
      <IndiceFixo ids={SECOES} />
      <Consentimento />
    </>
  );
}
