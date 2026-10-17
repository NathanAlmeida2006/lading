import { Rotulo } from "../components/Rotulo.jsx";
import { bloco, envelope } from "../ui.js";

/**
 * Amostra: a unica secao opcional da sequencia (RF-L08).
 *
 * Fica desligada em `config.secoes.amostra.ativo` ate o Marco 4 do Lithium entregar
 * os protocolos finalizados. Ate la nao ha miolo real para mostrar, e amostra
 * inventada quebraria a continuidade de promessa que a pagina inteira defende.
 */
export function Amostra() {
  return (
    <section id="amostra" className={`${bloco} py-16 md:py-24`} data-theme="cartaz">
      <div className={envelope}>
        <Rotulo>amostra</Rotulo>
        <h2 className="titulo text-bone font-secundaria text-h1 uppercase lg:text-display">Um trecho do miolo</h2>
        <p className="max-w-prose font-terciaria text-body-lg">Trecho real do protocolo entra aqui, quando houver.</p>
      </div>
    </section>
  );
}
