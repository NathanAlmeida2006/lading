import { PilhaDeValor } from "./PilhaDeValor.jsx";

/** A oferta e a pilha de valor, com a ancora `#oferta` e a posicao `oferta` do CTA. */
export function Oferta({ params }) {
  return <PilhaDeValor params={params} id="oferta" posicao="oferta" />;
}
