import { useEffect, useRef } from "react";
import { Rotulo } from "../components/Rotulo.jsx";
import { acenderEmSequencia } from "../motion/index.js";

/**
 * Reconhecimento: a situacao do visitante, na frase dele, palavra a palavra.
 *
 * Sai direto do angulo teto-natural: o §9 da persona registra o mito "natural
 * nao cresce" e o §2 registra que ela desconfia do fisico hormonizado vendido
 * como natural. As duas crencas nunca se encontraram, e a secao inteira e o
 * encontro.
 *
 * A forma vem do Nakula: cada palavra e um elemento e acende conforme a
 * pagina desce, ligada a rolagem e nao disparada por ela. O texto fica
 * grudado no meio da tela enquanto a secao passa por baixo.
 *
 * Parceiro, nunca juiz: nenhuma frase aqui culpa o leitor (TR-08). Descreve
 * o padrao e troca a regua; nao da bronca.
 */
const TEXTO =
  "Você desconfia do shape do feed. E mede o seu potencial por ele mesmo assim. " +
  "Treina em ondas de duas a seis semanas, e toda onda termina na mesma conclusão: " +
  "sem genética ou sem bomba, não dá. A conclusão está certa. A régua está errada.";

export function Manifesto() {
  const raiz = useRef(null);

  useEffect(() => {
    const no = raiz.current;
    if (!no) return;
    const anim = acenderEmSequencia(no.querySelectorAll(".palavra"), no);
    return () => anim?.revert?.();
  }, []);

  return (
    <section id="reconhecimento" className="bloco manifesto" ref={raiz}>
      <div className="manifesto__fixo envelope">
        <Rotulo>onde você está</Rotulo>
        <p className="manifesto__texto display">
          {TEXTO.split(" ").map((palavra, indice) => (
            // O espaco fica FORA do span: espaco no fim de um inline-block e
            // descartado pelo navegador, e as palavras colavam.
            <span key={`${palavra}-${indice}`}>
              <span className="palavra">{palavra}</span>{" "}
            </span>
          ))}
        </p>
      </div>
    </section>
  );
}
