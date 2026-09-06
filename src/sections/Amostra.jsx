import { Secao } from "../components/Secao.jsx";

/**
 * Amostra: a unica secao opcional da sequencia (RF-L08).
 *
 * Fica desligada em `config.mostrarAmostra` ate o Marco 4 do Lithium entregar
 * os protocolos finalizados. Ate la nao ha miolo real para mostrar, e amostra
 * inventada quebraria a continuidade de promessa que a pagina inteira defende.
 */
export function Amostra() {
  return (
    <Secao id="amostra" tema="cartaz" kicker="Amostra" titulo="Um trecho do miolo">
      <p className="body-lg prosa">
        Trecho real do protocolo entra aqui, quando houver.
      </p>
    </Secao>
  );
}
