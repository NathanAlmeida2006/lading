import { CampoDePontos } from "../components/CampoDePontos.jsx";
import { Fragment, useRef } from "react";
import { Rotulo } from "../components/Rotulo.jsx";
import { acenderEmSequencia, useMovimento } from "../motion/index.js";
import { bloco, envelope } from "../ui.js";

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
 *
 * A secao e mais alta que a tela e o texto fica grudado no meio dela: e o
 * trilho que mede (`acenderEmSequencia` le a travessia da secao) e o texto que
 * exibe. Quem gruda nunca e quem mede.
 */
const TEXTO =
  "Você desconfia do shape do feed. E mede o seu potencial por ele mesmo assim. " +
  "Treina em ondas de duas a seis semanas, e toda onda termina na mesma conclusão: " +
  "sem genética ou sem bomba, não dá. A conclusão está certa. A régua está errada.";

// Cada palavra troca de estado como carimbo. Nasce apagada so sob `js:`: sem
// JavaScript o manifesto abre inteiro e legivel (RNF-L16).
const PALAVRA =
  "palavra inline-block transition-[opacity] duration-(--motion-fast) ease-(--ease-corte-2) " +
  "js:opacity-[0.16] data-acesa:opacity-100 motion-reduce:js:opacity-100";

export function Manifesto() {
  const raiz = useRef(null);

  useMovimento(() => {
    const no = raiz.current;
    if (!no) return;
    const anim = acenderEmSequencia(no.querySelectorAll(".palavra"), no);
    return () => anim?.revert?.();
  }, []);

  return (
    <section id="reconhecimento" className={`${bloco} min-h-[170svh] py-0 motion-reduce:min-h-0 motion-reduce:py-16`} ref={raiz}>
      <CampoDePontos variante="estelar" />
      <div className={`${envelope} sticky top-[14svh] lg:top-[10svh] z-1 py-12 motion-reduce:static motion-reduce:py-0`}>
        <Rotulo como="h2">onde você está</Rotulo>
        <p className="font-secundaria text-display normal-case tracking-[-0.005em] leading-[1.05] max-w-[14ch] text-bone lg:text-[length:clamp(48px,5.2vw,76px)] lg:leading-[1.02] lg:max-w-[24ch]">
          {TEXTO.split(" ").map((palavra, indice) => (
            // O espaco fica FORA do span: espaco no fim de um inline-block e
            // descartado pelo navegador, e as palavras colavam.
            <Fragment key={`${palavra}-${indice}`}>
              <span className={PALAVRA}>{palavra}</span>{" "}
            </Fragment>
          ))}
        </p>
      </div>
    </section>
  );
}
