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
 * JavaScript ela nao existe (`hidden js:flex`). Uma doca em CSS puro comeria
 * 56px da primeira tela e derrubaria o RF-L09 justamente em quem chega pelo
 * anuncio.
 *
 * Inativa, ela e `inert`: so sai da tela por `translate`, e sem isso o Tab cairia
 * num botao que ninguem ve.
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

  // A classe `com-doca` no <body> e o que o resto da pagina le: o indice fixo sobe e o
  // <html> ganha `scroll-pb-20` (index.html), para ancora nao parar atras da doca.
  useEffect(() => {
    document.body.classList.toggle("com-doca", ativa);
    return () => document.body.classList.remove("com-doca");
  }, [ativa]);

  const { preco, moeda } = config.oferta;

  return (
    <aside
      className="doca hidden js:flex fixed inset-x-0 bottom-0 z-15 items-center justify-between gap-4 px-4 pt-3 pb-[max(--spacing(3),env(safe-area-inset-bottom))] bg-surface-1 text-bone border-t border-line-strong translate-y-full transition-[translate] duration-(--motion-base) ease-(--ease-corte-2) [.com-consentimento_&]:hidden data-ativa:translate-y-0"
      data-ativa={ativa ? "" : undefined}
      aria-label="Oferta"
      aria-hidden={!ativa}
      inert={!ativa}
    >
      <div className="flex flex-col gap-1 min-w-0 text-silver">
        <span className="font-secundaria text-label uppercase text-bone">Protocolo 01</span>
        <span className="font-terciaria text-mono-reg tabular-nums">
          {preco ? `${moeda} ${preco} · Pix à vista` : "Pix à vista · preço a definir"}
        </span>
      </div>
      <Botao params={params} posicao="doca" compacto />
    </aside>
  );
}
