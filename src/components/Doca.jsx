import { useEffect, useState } from "react";
import { Botao } from "./Botao.jsx";
import { config } from "../config.js";

/**
 * A doca de venda: barra fixa na base, com preco, Pix e o botao.
 *
 * Vem da barra flutuante do Nakula e da barra fixa do Kora, que sacrificam a
 * navegacao constante em troca de um CTA sempre visivel. Aqui nao ha
 * navegacao a sacrificar (RF-L01), entao a troca e so ganho.
 *
 * Entra quando a dobra sai da tela e sai quando o fechamento ou o rodape
 * entram, as tres
 * por corte. Tres coisas que ela NAO faz, cada uma uma trava: nenhuma barra
 * de progresso (o §3.5 proibe), o rotulo nao troca com a secao (RF-L10), e sem
 * JavaScript ela nao existe. Uma doca em CSS puro comeria 56px da primeira
 * tela e derrubaria o RF-L09 justamente em quem chega pelo anuncio.
 */
export function Doca({ params }) {
  const [ativa, definirAtiva] = useState(false);

  useEffect(() => {
    const inicio = document.getElementById("inicio");
    const fim = document.getElementById("fechamento");
    const rodape = document.querySelector(".rodape");
    if (!inicio || !fim || !("IntersectionObserver" in window)) return;
    const visiveis = new Set();
    const obs = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (e.isIntersecting) visiveis.add(e.target.id);
          else visiveis.delete(e.target.id);
        }
        definirAtiva(visiveis.size === 0);
      },
      { threshold: 0.12 },
    );
    obs.observe(inicio);
    obs.observe(fim);
    // O rodape tem o proprio botao e a faixa de acento: a doca por cima dele
    // seria o segundo acento na mesma tela.
    if (rodape) obs.observe(rodape);
    return () => obs.disconnect();
  }, []);

  // O <main> ganha a folga da doca enquanto ela esta ativa, senao ela cobre
  // o fim do texto.
  useEffect(() => {
    document.body.classList.toggle("com-doca", ativa);
    return () => document.body.classList.remove("com-doca");
  }, [ativa]);

  const { preco, moeda } = config.oferta;

  return (
    <aside className={`doca${ativa ? " doca--ativa" : ""}`} aria-label="Oferta" aria-hidden={!ativa}>
      <div className="doca__info">
        <span className="label">Protocolo 01</span>
        <span className="mono-reg" data-num>
          {preco ? `${moeda} ${preco} · Pix à vista` : "Pix à vista · preço a definir"}
        </span>
      </div>
      <Botao params={params} posicao="doca" compacto />
    </aside>
  );
}
