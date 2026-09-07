import { useEffect, useRef } from "react";
import { Botao } from "../components/Botao.jsx";
import { Rotulo } from "../components/Rotulo.jsx";
import { mascaraDeLinha, revelar, revelarEmCascata } from "../motion/index.js";
import { config } from "../config.js";

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
 */
const INCLUI = [
  "O protocolo de hipertrofia completo, em PDF e EPUB, pra ler no celular",
  "O Kit: sete anexos nomeados, pra abrir dentro da academia",
  "A tabela de retorno, pra semana que você faltar",
  "As fontes de cada afirmação técnica, com autor e ano",
];

const DEPOIS = [
  "Paga no checkout da Ticto, em Pix.",
  "O arquivo chega no seu e-mail em minutos.",
  "Abre no celular. Sem área de membros, sem senha pra esquecer.",
];

export function Oferta({ params }) {
  const raiz = useRef(null);

  useEffect(() => {
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
    <section id="oferta" className="bloco oferta" data-theme="cartaz" ref={raiz}>
      <div className="envelope oferta__grade">
        <header className="oferta__cabeca">
          <Rotulo>a oferta</Rotulo>
          <h2 className="titulo h1" data-revelar>
            O que chega no seu e-mail
          </h2>
        </header>

        <article className="recibo" data-revelar>
          <header className="recibo__cabeca">
            <span className="overline">Protocolo 01 · Hipertrofia</span>
            <span className="mono-reg" data-num>
              [v1.0]
            </span>
          </header>

          <ol className="recibo__itens">
            {INCLUI.map((item, indice) => (
              <li key={item} data-revelar>
                <span className="mono-reg" data-num>
                  [{String(indice + 1).padStart(2, "0")}]
                </span>
                <p className="body">{item}</p>
              </li>
            ))}
          </ol>

          <div className="recibo__total">
            <span className="recibo__rotulo overline">total</span>
            {preco ? (
              <span className="recibo__preco">
                <span className="recibo__moeda h3">{moeda}</span>
                <span className="recibo__valor stat" data-num>
                  {preco}
                </span>
              </span>
            ) : (
              <span className="recibo__valor h2">a definir</span>
            )}
            <span className="recibo__prazo label">à vista no Pix</span>
            {parcelamento ? <span className="caption">ou no cartão em até {parcelamento}</span> : null}
          </div>
        </article>

        <div className="oferta__depois">
          <Rotulo>depois do Pix</Rotulo>
          <ol className="passos">
            {DEPOIS.map((passo, indice) => (
              <li key={passo} data-revelar>
                <span className="passos__indice h2" data-num>
                  {String(indice + 1).padStart(2, "0")}
                </span>
                <p className="body-lg">{passo}</p>
              </li>
            ))}
          </ol>

          <div className="chamada" data-revelar>
            <Botao params={params} posicao="oferta" />
            <span className="microregistro mono-reg">Preço e Pix antes do clique. Nenhuma surpresa depois.</span>
          </div>
        </div>
      </div>
    </section>
  );
}
