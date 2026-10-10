import { useRef } from "react";
import { CarrosselDepoimentos } from "../components/CarrosselDepoimentos.jsx";
import { Rotulo } from "../components/Rotulo.jsx";
import { config } from "../config.js";
import { conteudo } from "../conteudo.js";
import { revelar, useMovimento } from "../motion/index.js";

/**
 * Complemento da Prova (nao uma secao de primeiro nivel): relatos de uso,
 * so os aprovados e com texto. Zero relatos: nada no DOM. Relato nao e
 * medicao (RF-L35), entao vem DEPOIS da evidencia e nunca no lugar dela.
 */
export function ProvaSocial({ depoimentos = config.depoimentos }) {
  const raiz = useRef(null);
  useMovimento(() => {
    revelar(raiz.current);
  }, []);

  const aprovados = depoimentos.filter((d) => d.aprovado === true && d.texto?.trim());
  if (!aprovados.length) return null;
  const { rotulo, titulo, nota, ...textos } = conteudo.provaSocial;

  return (
    <div id="prova-social" className="mt-12" ref={raiz} data-revelar>
      <Rotulo>{rotulo}</Rotulo>
      <h3 className="text-bone font-secundaria text-h3 normal-case tracking-normal lg:text-h2">{titulo}</h3>
      <p className="max-w-prose mt-3 mb-8 text-silver font-terciaria text-body lg:text-body-lg">{nota}</p>
      <CarrosselDepoimentos depoimentos={aprovados} {...textos} />
    </div>
  );
}
