import { useRef } from "react";
import { Botao } from "../components/Botao.jsx";
import { Rotulo } from "../components/Rotulo.jsx";
import { mascaraDeLinha, revelar, revelarEmCascata, useMovimento } from "../motion/index.js";
import { semMovimento } from "../motion/tokens.js";
import { config } from "../config.js";
import { conteudo } from "../conteudo.js";
import { useCondicaoOferta } from "../oferta.js";
import { CondicaoOferta } from "../components/CondicaoOferta.jsx";
import { bloco, envelope, mascara } from "../ui.js";

// Itens integrantes do protocolo; não são bônus.
const INCLUI = conteudo.oferta.inclui;
const PENDENTE = "a confirmar neste preview";
const texto = (valor) => typeof valor === "string" && valor.trim().length > 0;
const precoValido = (valor) => {
  if (typeof valor === "number") return Number.isFinite(valor) && valor > 0;
  return texto(valor) && /^(?:\d{1,3}(?:\.\d{3})+|\d+)(?:,\d{2})?$/.test(valor) && Number(valor.replaceAll(".", "").replace(",", ".")) > 0;
};
const numeroEmReais = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const exibirPreco = (valor) => typeof valor === "number" ? numeroEmReais.format(valor) : valor;
const SERRILHA =
  "before:absolute before:inset-x-0 before:-top-1.5 before:h-1.5 before:bg-repeat-x before:bg-[length:8px_6px] before:bg-(image:--serrilha-sup) " +
  "after:absolute after:inset-x-0 after:-bottom-1.5 after:h-1.5 after:bg-repeat-x after:bg-[length:8px_6px] after:bg-(image:--serrilha-inf)";

/** Recibo e acesso seguem a mesma coluna, com os dados antes do CTA. */
export function Oferta({ params }) {
  const raiz = useRef(null);
  const { condicao, estado, disponivel } = useCondicaoOferta(config.oferta, config.checkout);
  useMovimento(() => {
    if (semMovimento()) return;
    const no = raiz.current;
    if (!no) return;
    revelar(no.querySelector(".rotulo"));
    mascaraDeLinha(no.querySelector(".titulo"), { atraso: 60 });
    revelar(no.querySelector(".recibo"));
    revelarEmCascata(no.querySelectorAll(".recibo__itens > li"), { intervalo: 50 });
    revelarEmCascata(no.querySelectorAll(".passos > div"), { intervalo: 60 });
    revelar(no.querySelector(".chamada"));
  }, []);

  const { preco, moeda, pix, parcelamento, bonus, ancoragem } = config.oferta;
  const adicionais = (Array.isArray(bonus) ? bonus : []).filter((item) => item?.confirmado === true && texto(item.id) && texto(item.nome) && texto(item.descricao) && texto(item.origem));
  const referencia = ancoragem?.confirmado === true && texto(ancoragem.fonte) && texto(ancoragem.fundamento) && precoValido(ancoragem.precoComparativo);
  const entrega = [
    ["Formato", config.entrega.formato],
    ["Canal de entrega", config.entrega.canal],
    ["Como acessar", config.entrega.modoDeAcesso],
    ["Prazo de entrega", config.entrega.prazo],
  ];

  return (
    <section id="oferta" className={`${bloco} py-16 md:py-24`} data-theme="cartaz" ref={raiz}>
      <div className={envelope}>
        <div className="max-w-[65ch] min-w-0 mx-auto">
          <header className="mb-8">
            <Rotulo>a oferta</Rotulo>
            <h2 className={`titulo text-bone font-secundaria text-h1 uppercase lg:text-display ${mascara}`} data-revelar>
              O que você leva
            </h2>
          </header>

          <article className={`recibo relative my-1.5 p-6 lg:p-8 bg-surface-1 border-x border-line ${SERRILHA}`} data-revelar>
            <header className="flex flex-wrap justify-between gap-4 pb-4 text-silver border-b border-dashed border-line-strong">
              <h3 className="font-secundaria text-overline uppercase">Protocolo 01 · Hipertrofia</h3>
              <span className="font-terciaria text-mono-reg tabular-nums">[v1.0]</span>
            </header>

            <ol className="recibo__itens" role="list">
              {INCLUI.map((item, indice) => (
                <li className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 py-3 text-silver not-first:border-t not-first:border-line" key={item.texto} data-revelar>
                  <span className="font-terciaria text-mono-reg tabular-nums">[{String(indice + 1).padStart(2, "0")}]</span>
                  <p className="text-bone font-terciaria text-body lg:text-body-lg wrap-anywhere">{item.texto}{indice === 0 ? `, em ${texto(config.entrega.formato) ? config.entrega.formato : PENDENTE}` : ""}</p>
                </li>
              ))}
            </ol>

            {adicionais.length > 0 ? (
              <div className="mt-4 pt-4 border-t border-dashed border-line-strong">
                <h4 className="text-silver font-secundaria text-overline uppercase">bônus confirmados</h4>
                <ul role="list">
                  {adicionais.map((item) => (
                    <li className="py-3 font-terciaria text-body lg:text-body-lg wrap-anywhere" key={item.id}>
                      <strong className="font-semibold">{item.nome}</strong>
                      <p>{item.descricao}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <dl className="flex flex-col gap-4 mt-4 pt-4 border-t border-dashed border-line-strong">
              <div>
                <dt className="text-silver font-secundaria text-overline uppercase">preço total</dt>
                <dd className="mt-2 text-bone-pure font-secundaria tabular-nums wrap-anywhere">
                  {precoValido(preco) ? (
                    <span className="text-stat"><span className="text-h3">{moeda} </span>{exibirPreco(preco)}</span>
                  ) : (
                    <span className="text-h2">{PENDENTE}</span>
                  )}
                </dd>
              </div>
              <div className="font-terciaria text-body lg:text-body-lg wrap-anywhere">
                <dt className="text-silver font-secundaria text-overline uppercase">Pix à vista</dt>
                <dd className="mt-2">
                  {pix?.ativo === false ? "indisponível" : pix?.ativo === true && precoValido(pix.valor) ? `${moeda} ${exibirPreco(pix.valor)}` : PENDENTE}
                </dd>
              </div>
              {texto(parcelamento) ? (
                <div className="font-terciaria text-body lg:text-body-lg wrap-anywhere">
                  <dt className="text-silver font-secundaria text-overline uppercase">parcelamento no cartão</dt>
                  <dd className="mt-2">{parcelamento}</dd>
                </div>
              ) : null}
            </dl>

            {referencia ? (
              <div className="mt-4 pt-4 border-t border-dashed border-line-strong font-terciaria text-body lg:text-body-lg wrap-anywhere">
                <p>Preço de referência: {moeda} {exibirPreco(ancoragem.precoComparativo)}</p>
                <p className="mt-2">{ancoragem.fundamento}</p>
                <p className="mt-2 text-silver text-caption">Fonte: {ancoragem.fonte}</p>
              </div>
            ) : null}
          </article>

          <div className="mt-12">
            <Rotulo como="h3">depois do pagamento</Rotulo>
            <dl className="passos">
              {entrega.map(([rotulo, valor]) => (
                <div className="py-3 border-t border-line wrap-anywhere" key={rotulo} data-revelar>
                  <dt className="text-silver font-secundaria text-overline uppercase">{rotulo}</dt>
                  <dd className="mt-2 font-terciaria text-body-lg">{texto(valor) ? valor : PENDENTE}</dd>
                </div>
              ))}
            </dl>

            <CondicaoOferta condicao={condicao} estado={estado} />

            {disponivel ? <div className="chamada flex flex-col items-start mt-12" data-revelar>
              <Botao params={params} posicao="oferta" />
            </div> : null}
          </div>
        </div>
      </div>
    </section>
  );
}
