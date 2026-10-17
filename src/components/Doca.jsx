import { useEffect, useRef, useState } from "react";
import { Botao } from "./Botao.jsx";
import { Cronometro } from "./Cronometro.jsx";
import { config } from "../config.js";
import { useConsentimento } from "../instrumentacao.js";
import { useCondicaoOferta } from "../oferta.js";
import { pilhaApresentavel } from "../pilha.js";

/**
 * A doca de venda: barra fixa na base, com preco, Pix e o botao.
 *
 * Vem da barra flutuante do Nakula e da barra fixa do Kora, que sacrificam a
 * navegacao constante em troca de um CTA sempre visivel. Aqui nao ha
 * navegacao a sacrificar (RF-L01), entao a troca e so ganho.
 *
 * Ela e o CTA de quando nao ha CTA: so entra na janela do meio da pagina, com a dobra, a regua do
 * manifesto, a pilha de valor, o botao do fechamento e o rodape fora da tela, e nunca com o aviso de
 * cookies aberto. Os botoes do espelho, do mapa e da oferta NAO sao observados: com eles a doca pode
 * dividir a tela (pendencia B3, decisao do gerente). Entra e sai deslizando, com
 * ease suave de 500 ms. Tres coisas que ela NAO faz, cada uma uma trava: nenhuma barra
 * de progresso (o §3.5 proibe), o rotulo nao troca com a secao (RF-L10), e sem
 * JavaScript ela nao existe (`hidden js:flex`). Uma doca em CSS puro comeria
 * 56px da primeira tela e derrubaria o RF-L09 justamente em quem chega pelo
 * anuncio.
 *
 * A decisao le so a geometria da rolagem, nunca o estado da propria doca: ela e fixa, nao
 * empurra o conteudo, e o botao dela fica fora dos alvos. Um botao que sobe por tras da doca ja
 * conta como "a vista" e a recolhe; nao ha como a entrada dela realimentar o observador.
 *
 * Falha fechada: sem IntersectionObserver, sem os alvos, ou antes da primeira leitura, fica oculta.
 *
 * Inativa, ela e `inert`: so sai da tela por `translate`, e sem isso o Tab cairia
 * num botao que ninguem ve.
 */
// O preco vem da pilha de valor (config estatica: conferida uma vez); `config.oferta.preco` segue nulo.
const OFERTA = pilhaApresentavel(config.pilhaDeValor);

export function Doca() {
  const doca = useRef(null);
  const [livre, definirLivre] = useState(false); // nenhum alvo ocupa a tela
  // Os botoes de venda nascem e somem juntos, com a disponibilidade da oferta: e ela que
  // manda refazer a lista de alvos. Sem botao proprio, a doca tambem nao tem o que oferecer.
  const { disponivel } = useCondicaoOferta(config.oferta, config.checkout);
  const avisoAberto = useConsentimento() === null;
  const ativa = livre && disponivel && !avisoAberto;

  useEffect(() => {
    const inicio = document.getElementById("inicio");
    // A doca fica sempre visivel, menos na dobra, na regua do treino (manifesto), com o CTA do fechamento visivel e no rodape.
    const regua = document.getElementById("reconhecimento");
    // O rodape tem o proprio botao e a faixa de acento: a doca por cima dele
    // seria o segundo acento na mesma tela.
    const rodape = document.getElementById("rodape-legal");
    if (!inicio || !regua || !rodape || !("IntersectionObserver" in window)) return;
    const naTela = new Set();
    const obs = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (e.isIntersecting) naTela.add(e.target);
          else naTela.delete(e.target);
        }
        definirLivre(naTela.size === 0);
      },
      { threshold: 0 }, // qualquer pixel do alvo na tela esconde a doca; a regua e alta, 12% dela ainda cobria a janela
    );
    // O CTA do fechamento tem a propria acao na tela: a doca sai enquanto ele estiver visivel.
    const ctaFechamento = document.querySelector('[data-posicao="fechamento"]');
    // A pilha de valor tambem esconde a doca enquanto tiver qualquer pixel na tela; sem a secao, e nulo.
    const pilha = document.getElementById("pilha-de-valor");
    for (const alvo of [inicio, regua, rodape, ctaFechamento, pilha]) if (alvo) obs.observe(alvo);
    return () => {
      obs.disconnect();
      definirLivre(false);
    };
  }, [disponivel]);

  // O indice e o espaco de rolagem acompanham a altura real da barra, inclusive
  // quando o texto quebra com zoom ou a safe-area aumenta seu tamanho.
  useEffect(() => {
    const barra = doca.current;
    if (!barra) return;
    const estilo = document.documentElement.style;
    const alturaAnterior = estilo.getPropertyValue("--doca-altura");
    const prioridadeAnterior = estilo.getPropertyPriority("--doca-altura");
    let encerrado = false;

    const medirAltura = () => {
      if (encerrado) return;
      const altura = barra.getBoundingClientRect().height;
      // O consentimento pode ocultar a barra com display:none. Nesse intervalo,
      // preservar a ultima medida valida ou o fallback definido nos estilos.
      if (altura > 0) estilo.setProperty("--doca-altura", `${Math.ceil(altura)}px`);
    };

    const observador = "ResizeObserver" in window ? new ResizeObserver(medirAltura) : null;
    observador?.observe(barra);
    window.addEventListener("resize", medirAltura);
    document.fonts?.ready.then(medirAltura);
    medirAltura();

    return () => {
      encerrado = true;
      observador?.disconnect();
      window.removeEventListener("resize", medirAltura);
      if (alturaAnterior) estilo.setProperty("--doca-altura", alturaAnterior, prioridadeAnterior);
      else estilo.removeProperty("--doca-altura");
    };
  }, []);

  // A classe `com-doca` no <body> ativa a reserva de espaco do indice e das ancoras.
  useEffect(() => {
    document.body.classList.toggle("com-doca", ativa);
    return () => document.body.classList.remove("com-doca");
  }, [ativa]);

  return (
    <aside
      ref={doca}
      className="doca hidden js:flex fixed inset-x-0 bottom-0 z-15 flex-wrap items-center justify-between gap-3 pl-[max(--spacing(4),env(safe-area-inset-left))] pr-[max(--spacing(4),env(safe-area-inset-right))] pt-3 pb-[max(--spacing(3),env(safe-area-inset-bottom))] bg-surface-1 text-bone border-t border-line-strong translate-y-full opacity-0 transition-[translate,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none [.com-consentimento_&]:hidden data-ativa:translate-y-0 data-ativa:opacity-100"
      data-ativa={ativa ? "" : undefined}
      aria-label="Oferta"
      aria-hidden={!ativa}
      inert={!ativa}
    >
      <div className="flex flex-col gap-1 min-w-0 max-w-full text-silver">
        <span className="font-secundaria text-label uppercase text-bone">Protocolo 01</span>
        <div className="font-terciaria text-mono-reg tabular-nums whitespace-nowrap">
          {OFERTA ? `${OFERTA.moeda} ${OFERTA.oferta.preco} · Pix à vista` : "Pix à vista · preço a definir"}
        </div>
      </div>
      {OFERTA ? <Cronometro classe="ml-auto text-mono-reg [&>span]:hidden" /> : null}
      <Botao posicao="doca" compacto />
    </aside>
  );
}
