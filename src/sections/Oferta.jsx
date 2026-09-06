import { useEffect, useRef } from "react";
import { Secao } from "../components/Secao.jsx";
import { Botao } from "../components/Botao.jsx";
import { revelarEmCascata } from "../motion/index.js";
import { config } from "../config.js";

/**
 * A oferta.
 *
 * Preco visivel ANTES do clique (RF-L23): preco que so aparece depois e a
 * mecanica que a persona le como golpe (§13). Pix em primeiro plano (RF-L22),
 * porque e como ela paga. E o que acontece depois do pagamento esta escrito
 * (RF-L25): entrega implicita e objecao nao respondida.
 */
const INCLUI = [
  "O protocolo de hipertrofia completo, em PDF, para ler no celular",
  "O Kit: os sete anexos nomeados, para usar dentro da academia",
  "A tabela de retorno, para a semana que você faltar",
  "As fontes de cada afirmação técnica, com autor e ano",
];

export function Oferta({ params }) {
  const raiz = useRef(null);

  useEffect(() => {
    revelarEmCascata(raiz.current?.querySelectorAll(".inclui > li"), {
      intervalo: 50,
    });
  }, []);

  const { preco, moeda, parcelamento } = config.oferta;

  return (
    <Secao id="oferta" indice={6} tema="cartaz" kicker="A oferta" titulo="O que está incluído">
      <div className="oferta" ref={raiz}>
        <ul className="inclui">
          {INCLUI.map((item) => (
            <li key={item} data-revelar>
              <span className="inclui__marca" aria-hidden="true">
                &#8224;
              </span>
              <p className="body prosa">{item}</p>
            </li>
          ))}
        </ul>

        <p className="oferta__preco">
          {preco ? (
            <>
              <span className="oferta__moeda h3">{moeda}</span>
              <span className="oferta__valor stat" data-num>
                {preco}
              </span>
            </>
          ) : (
            <span className="oferta__valor h2">Preço a definir</span>
          )}
        </p>

        <p className="body">
          Pagamento em <strong>Pix</strong>, à vista.
          {parcelamento ? ` Cartão em até ${parcelamento}.` : ""}
        </p>

        <p className="body prosa" style={{ marginTop: "var(--space-4)" }}>
          Depois do pagamento, o arquivo chega no seu e-mail. É download
          direto, não é área de membros, e não tem senha para esquecer.
        </p>

        <div style={{ marginTop: "var(--space-5)" }}>
          <Botao params={params} posicao="oferta" />
        </div>
      </div>
    </Secao>
  );
}
