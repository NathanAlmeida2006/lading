import { useRef } from "react";
import { Rotulo } from "../components/Rotulo.jsx";
import { carimbar, revelar, useMovimento } from "../motion/index.js";
import { config } from "../config.js";
import { bloco, envelope } from "../ui.js";

/**
 * A garantia, como selo carimbado.
 *
 * Em texto e na propria pagina, nunca em link (RF-L24). A persona ja pediu
 * reembolso de infoproduto antes (§10) e VAI checar se e facil (§13):
 * esconder a condicao aqui confirma a suspeita que ela ja traz.
 *
 * A forma e o carimbo do sistema: entra em tres degraus, e a unica peca da
 * pagina levemente fora do eixo, porque carimbo nunca cai reto. Cruz de
 * registro nos vertices e selo de versao no rodape sao micro-registro do §7.
 *
 * ATENCAO: a inclinacao e `transform: rotate(-2deg)` de proposito, e nao a
 * utilitaria `-rotate-2` (que escreve a propriedade `rotate`). O `carimbar`
 * anima `scale` pelo anime.js, que reescreve `transform` inteiro e, com isso,
 * apaga a inclinacao assim que o carimbo termina: o selo roda torto sem JS e
 * termina reto com ele. E o comportamento que a pagina sempre teve, e a
 * propriedade `rotate` o mudaria sem aviso.
 */
const CRUZ =
  "absolute size-3.25 pointer-events-none " +
  "before:absolute before:bg-bone before:left-1.5 before:top-0 before:w-px before:h-3.25 " +
  "after:absolute after:bg-bone after:top-1.5 after:left-0 after:w-3.25 after:h-px";

export function Garantia() {
  const raiz = useRef(null);
  const dias = config.oferta.garantiaDias;

  useMovimento(() => {
    const no = raiz.current;
    if (!no) return;
    revelar(no.querySelector(".rotulo"));
    carimbar(no.querySelector(".selo"), { atraso: 120 });
  }, []);

  return (
    <section id="garantia" className={`${bloco} py-16 md:py-24`} data-theme="cartaz" ref={raiz}>
      <div className={`${envelope} flex flex-col lg:items-center`}>
        <Rotulo className="lg:self-start">garantia</Rotulo>

        <div
          className="selo relative mt-4 mx-2 mb-8 px-6 py-8 lg:px-12 lg:py-16 lg:max-w-160 bg-void border-2 border-bone outline outline-bone outline-offset-[5px] [transform:rotate(-2deg)] origin-center will-change-[transform,opacity] motion-reduce:transform-none"
          data-revelar
        >
          <span className={`${CRUZ} -top-5 -left-5`} aria-hidden="true" />
          <span className={`${CRUZ} -top-5 -right-5`} aria-hidden="true" />
          <span className={`${CRUZ} -bottom-5 -left-5`} aria-hidden="true" />
          <span className={`${CRUZ} -bottom-5 -right-5`} aria-hidden="true" />

          <h2 className="mb-4 text-bone font-secundaria text-display uppercase">Devolve.</h2>
          <p className="max-w-prose font-terciaria text-body-lg">
            {dias ? (
              <>
                Você tem <strong className="font-semibold">{dias} dias</strong> pra ler e decidir. Não serviu, pede o reembolso por
                e-mail, em uma linha, e recebe de volta. Sem justificar.
              </>
            ) : (
              <>
                O prazo entra aqui, em texto, antes da página ir ao ar. Não serviu, pede o reembolso por
                e-mail, em uma linha, e recebe de volta. Sem justificar.
              </>
            )}
          </p>
          <p className="max-w-prose mt-3 text-silver font-terciaria text-body lg:text-body-lg">
            Não tem formulário de retenção, não tem ligação, e ninguém vai tentar te convencer do
            contrário.
          </p>
          <p className="mt-6 text-silver font-terciaria text-mono-reg tabular-nums">
            [reembolso por e-mail · sem retenção]
          </p>
        </div>
      </div>
    </section>
  );
}
