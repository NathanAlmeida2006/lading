import { useEffect, useRef } from "react";
import { mascaraDeLinha, parallaxe, revelar } from "../motion/index.js";

/**
 * Uma secao da sequencia canonica (RF-L08).
 *
 * Duas coisas mudaram na versao 2, e as duas vem da engenharia reversa:
 *
 * `tema` - a pagina alterna blocos Sigilo e blocos Cartaz em vez de escolher
 * um. O RNF-G18 exige que os dois temas sejam nativos e paritarios, e alternar
 * e a leitura mais literal disso: nenhum componente existe so no escuro porque
 * todo componente atravessa os dois na mesma rolagem. A troca acontece no
 * limite da secao, em corte, que e o idioma do sistema.
 *
 * `indice` - o numero cru como ornamento, atras do titulo, na escala que o
 * token de titulo nao alcanca. E `aria-hidden`: e textura, nao conteudo.
 *
 * O `id` e o mesmo que a instrumentacao observa; trocar um aqui obriga a
 * trocar em `instrumentacao.js`.
 */
export function Secao({
  id,
  indice,
  kicker,
  titulo,
  children,
  tema = "sigilo",
  grao = false,
}) {
  const raiz = useRef(null);

  useEffect(() => {
    const no = raiz.current;
    if (!no) return;
    revelar(no.querySelector(".secao__kicker"));
    mascaraDeLinha(no.querySelector(".secao__titulo"), { atraso: 60 });
    parallaxe(no.querySelector(".secao__indice"), { fator: 0.14 });
  }, []);

  return (
    <section
      id={id}
      ref={raiz}
      className={`secao${grao ? " grao" : ""}`}
      data-theme={tema === "cartaz" ? "cartaz" : undefined}
    >
      <div className="envelope">
        {(kicker || titulo) && (
          <header className="secao__cabeca">
            {indice && (
              <span className="secao__indice stat" aria-hidden="true" data-num>
                {String(indice).padStart(2, "0")}
              </span>
            )}
            {kicker && (
              <span className="secao__kicker overline" data-revelar>
                <span className="glifo" aria-hidden="true">
                  &#8627;
                </span>
                {kicker}
              </span>
            )}
            {titulo && (
              <h2 className="secao__titulo h1" data-revelar>
                {titulo}
              </h2>
            )}
          </header>
        )}
        {children}
      </div>
    </section>
  );
}
