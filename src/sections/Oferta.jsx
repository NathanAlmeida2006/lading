import { useRef } from "react";
import { Botao } from "../components/Botao.jsx";
import { Rotulo } from "../components/Rotulo.jsx";
import { mascaraDeLinha, revelar, revelarEmCascata, useMovimento } from "../motion/index.js";
import { config } from "../config.js";
import { bloco, envelope, mascara } from "../ui.js";

/**
 * A oferta, como recibo.
 *
 * Preco visivel ANTES do clique (RF-L23), fatiado em tres elementos - moeda,
 * valor, prazo - que e o que separa uma tabela de preco caseira de uma que
 * parece produto (Nakula, Kora). Pix em primeiro plano (RF-L22), porque e
 * como a persona paga. E o que acontece depois do pagamento esta escrito
 * (RF-L25), em tres passos.
 *
 * A forma de recibo e o micro-registro do §7 do mestre visual em uso: serrilha
 * nas bordas, marcadores em colchetes, selo de versao. Documento catalogado,
 * nao anuncio. O valor e o unico lugar da pagina onde `--bone-pure` entra,
 * porque e placar.
 *
 * Serrilha: dente de 4px, altura 6px, um SVG de 8x6 repetido nas duas bordas
 * (`--serrilha-sup` e `--serrilha-inf`, em styles/residual.css).
 */
const INCLUI = [
  "O protocolo de hipertrofia completo, no app, pra treinar direto do celular",
  "O Kit: sete anexos nomeados, pra abrir dentro da academia",
  "A tabela de retorno, pra semana que você faltar",
  "As fontes de cada afirmação técnica, com autor e ano",
];

const DEPOIS = [
  "Paga no checkout da Ticto, em Pix.",
  "O link do app chega no seu e-mail em minutos.",
  "Abre no celular, direto pelo link. Sem área de membros, sem instalar nada.",
];

const SERRILHA =
  "before:absolute before:inset-x-0 before:-top-1.5 before:h-1.5 before:bg-repeat-x before:bg-[length:8px_6px] before:bg-(image:--serrilha-sup) " +
  "after:absolute after:inset-x-0 after:-bottom-1.5 after:h-1.5 after:bg-repeat-x after:bg-[length:8px_6px] after:bg-(image:--serrilha-inf)";

export function Oferta({ params }) {
  const raiz = useRef(null);

  useMovimento(() => {
    const no = raiz.current;
    if (!no) return;
    revelar(no.querySelector(".rotulo"));
    mascaraDeLinha(no.querySelector(".titulo"), { atraso: 60 });
    revelar(no.querySelector(".recibo"));
    revelarEmCascata(no.querySelectorAll(".recibo__itens > li"), { intervalo: 50 });
    revelarEmCascata(no.querySelectorAll(".passos > li"), { intervalo: 60 });
    revelar(no.querySelector(".chamada"));
  }, []);

  const { preco, moeda, parcelamento } = config.oferta;

  return (
    <section id="oferta" className={`${bloco} py-16 md:py-24`} data-theme="cartaz" ref={raiz}>
      <div className={`${envelope} lg:grid lg:grid-cols-[repeat(12,1fr)] lg:gap-x-8 lg:items-start`}>
        <header className="mb-8 lg:mb-0 lg:col-[1/span_4] lg:sticky lg:top-12">
          <Rotulo>a oferta</Rotulo>
          <h2 className={`titulo text-bone font-secundaria text-h1 uppercase lg:text-display ${mascara}`} data-revelar>
            O que chega no seu e-mail
          </h2>
        </header>

        <article
          className={`recibo relative my-1.5 p-6 lg:p-8 bg-surface-1 border-x border-line lg:col-[6/span_4] ${SERRILHA}`}
          data-revelar
        >
          <header className="flex justify-between gap-4 pb-4 text-silver border-b border-dashed border-line-strong">
            <h3 className="font-secundaria text-overline uppercase">Protocolo 01 · Hipertrofia</h3>
            <span className="font-terciaria text-mono-reg tabular-nums">[v1.0]</span>
          </header>

          <ol className="recibo__itens" role="list">
            {INCLUI.map((item, indice) => (
              <li
                className="grid grid-cols-[--spacing(12)_1fr] gap-3 py-3 text-silver not-first:border-t not-first:border-line"
                key={item}
                data-revelar
              >
                <span className="font-terciaria text-mono-reg tabular-nums">
                  [{String(indice + 1).padStart(2, "0")}]
                </span>
                <p className="text-bone font-terciaria text-body lg:text-body-lg">{item}</p>
              </li>
            ))}
          </ol>

          <dl className="grid grid-cols-[1fr_auto] [grid-template-areas:'rotulo_preco''rotulo_prazo'] items-end gap-x-4 gap-y-1 mt-4 pt-4 border-t border-dashed border-line-strong">
            <dt className="[grid-area:rotulo] self-start text-silver font-secundaria text-overline uppercase">total</dt>
            {preco ? (
              <dd className="[grid-area:preco] inline-flex items-start gap-1 justify-self-end">
                <span className="pt-[0.35em] text-silver font-secundaria text-h3">{moeda}</span>
                <span className="leading-none text-bone-pure font-secundaria text-stat tabular-nums">
                  {preco}
                </span>
              </dd>
            ) : (
              <dd className="[grid-area:preco] justify-self-end leading-none text-bone-pure font-secundaria text-h2 uppercase">
                a definir
              </dd>
            )}
            <dd className="[grid-area:prazo] justify-self-end text-bone font-secundaria text-label uppercase">
              à vista no Pix
            </dd>
            {parcelamento ? (
              <dd className="font-terciaria text-caption">ou no cartão em até {parcelamento}</dd>
            ) : null}
          </dl>
        </article>

        <div className="mt-12 lg:mt-0 lg:col-[10/-1]">
          <Rotulo como="h3">depois do Pix</Rotulo>
          <ol className="passos" role="list">
            {DEPOIS.map((passo, indice) => (
              <li className="grid grid-cols-[--spacing(12)_1fr] gap-3 py-3 border-t border-line" key={passo} data-revelar>
                <span className="leading-[1.3] text-silver font-secundaria text-h2 uppercase tabular-nums">
                  {String(indice + 1).padStart(2, "0")}
                </span>
                <p className="font-terciaria text-body-lg">{passo}</p>
              </li>
            ))}
          </ol>

          <div className="chamada flex flex-col items-start mt-12" data-revelar>
            <Botao params={params} posicao="oferta" />
            <p className="mt-3 text-silver font-terciaria text-mono-reg tabular-nums">
              Preço e Pix antes do clique. Nenhuma surpresa depois.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
