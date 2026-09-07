import { Rotulo } from "../components/Rotulo.jsx";

/**
 * Amostra: a unica secao opcional da sequencia (RF-L08).
 *
 * Fica desligada em `config.mostrarAmostra` ate o Marco 4 do Lithium entregar
 * os protocolos finalizados. Ate la nao ha miolo real para mostrar, e amostra
 * inventada quebraria a continuidade de promessa que a pagina inteira defende.
 */
export function Amostra() {
  return (
    <section id="amostra" className="bloco" data-theme="cartaz">
      <div className="envelope">
        <Rotulo>amostra</Rotulo>
        <h2 className="titulo h1">Um trecho do miolo</h2>
        <p className="body-lg prosa">Trecho real do protocolo entra aqui, quando houver.</p>
      </div>
    </section>
  );
}
