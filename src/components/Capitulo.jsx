import { useEffect, useRef } from "react";
import { empilharBlocos, mascaraDeLinha, medirPilha, parallaxe, revelar } from "../motion/index.js";

/**
 * Um capitulo travado: uma pilha DENTRO da pilha.
 *
 * A pagina inteira ja e uma pilha de secoes que grudam. O capitulo repete essa
 * mecanica um nivel abaixo, e por isso custa pouco: e o mesmo padrao que os
 * cartoes de fase do mapa (`.mapa__fases` mais `.fase`) ja pagaram com defeito
 * medido em 05/09/2026.
 *
 * Quem gruda nunca e quem mede. O trilho (`.capitulo__paineis`) fica no fluxo e
 * e o bloco de contencao; os paineis grudam dentro dele. Com o grude numa
 * camada de dentro do painel, o curso acabaria junto com o painel e ele iria
 * embora - isso e substituicao, nao acumulo.
 *
 * Painel COBRE, painel nao some. Nenhum painel e escondido por opacidade nem
 * por `display`, e e isso que mantem o RNF-L35 verde sem excecao nova no
 * verificador: painel coberto nao e painel invisivel. O apagamento vai no
 * CONTEUDO, nunca na caixa - caixa semitransparente sobre caixa deixa o texto
 * de baixo atravessar o de cima.
 */
export function Capitulo({
  id,
  indice,
  kicker,
  titulo,
  paineis,
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
    const nosPaineis = no.querySelectorAll(".painel-cap");
    const pararMedida = medirPilha(nosPaineis, { propriedade: "--altura-painel" });
    // `corte: true` e a decisao D5: a troca de painel e revelacao de marca, e
    // revelacao de marca corta. Os cartoes de fase seguem em curva continua.
    empilharBlocos(nosPaineis, {
      interno: ".painel-cap__caixa",
      corte: true,
    });
    return pararMedida;
  }, []);

  return (
    <section
      id={id}
      ref={raiz}
      data-capitulo=""
      className={`secao capitulo${grao ? " grao" : ""}`}
      data-theme={tema === "cartaz" ? "cartaz" : undefined}
    >
      <div className="envelope">
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

        <ol className="capitulo__paineis">
          {paineis.map((painel, ordem) => (
            <li
              className="painel-cap"
              key={painel.titulo}
              style={{ "--ordem": ordem, zIndex: ordem + 1 }}
            >
              <article className="painel-cap__caixa">
                <span className="painel-cap__conta mono-reg" data-num>
                  {String(ordem + 1).padStart(2, "0")} / {String(paineis.length).padStart(2, "0")}
                </span>
                <h3 className="painel-cap__titulo h3">{painel.titulo}</h3>
                {painel.conteudo}
              </article>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
