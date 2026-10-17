import { useEffect, useState } from "react";

/**
 * FAQ em acordeao, no layout do Rep Republic: pergunta e marca de mais/menos numa linha com fio
 * embaixo; o item aberto vira um bloco cheio em acento. Todos nascem fechados, e so um abre por vez.
 *
 * O estado e um so, `aberto` (o indice do item aberto), e o movimento e CSS: a altura da resposta
 * vai de `0fr` a `1fr` e o fundo em acento esmaece. Nenhum no e medido, clonado ou escrito na mao,
 * e nada fora da lista se move por transform, entao nao ha o que piscar ou quebrar ao rolar.
 *
 * `<details>` fica sempre `open`: quem anima e o CSS, e o `open` nativo e que deixa as respostas
 * legiveis sem JS (a regra `js:` e quem as recolhe). O clique do `summary` e tomado para o estado,
 * e `aria-expanded` e `inert` dizem a verdade a leitores de tela e ao teclado.
 */
export function PerguntasFrequentes({ itens }) {
  const [aberto, definirAberto] = useState(-1);
  // `inert` so depois da hidratacao: sem JS as respostas ficam expostas e selecionaveis.
  const [hidratado, definirHidratado] = useState(false);
  useEffect(() => definirHidratado(true), []);

  return (
    <div className="dialogo flex flex-col min-w-0">
      {itens.map(({ pergunta, resposta }, indice) => {
        const aqui = indice === aberto;
        return (
          <details
            className="group/pergunta relative isolate min-w-0 border-b border-line-strong first:border-t data-aberto:text-void transition-colors duration-700 ease-(--ease-expo) motion-reduce:transition-none before:content-[''] before:absolute before:inset-y-0 before:-inset-x-4 before:-z-10 before:bg-acento before:opacity-0 data-aberto:before:opacity-100 before:transition-opacity before:duration-700 before:ease-(--ease-expo) motion-reduce:before:transition-none"
            key={pergunta}
            open
            data-aberto={aqui ? "" : undefined}
            data-revelar
          >
            <summary
              className="flex items-start justify-between gap-4 py-5 cursor-pointer list-none [&::-webkit-details-marker]:hidden font-secundaria text-h3 wrap-anywhere lg:items-center lg:gap-8 lg:py-7 lg:text-h2"
              aria-expanded={aqui}
              onClick={(e) => {
                e.preventDefault();
                definirAberto(aqui ? -1 : indice);
              }}
            >
              <span className="hidden lg:block w-10 shrink-0 font-terciaria text-body tabular-nums opacity-60" aria-hidden="true">
                {String(indice + 1).padStart(2, "0")}
              </span>
              {/* Mobile: uma linha so. A maior pergunta mede ~19x o corpo em px, entao o corpo encolhe com a largura (20px no maximo). */}
              <span className="whitespace-nowrap [font-size:min(20px,calc((100vw-68px)/19))] lg:whitespace-normal lg:[font-size:inherit] lg:flex-1">{pergunta}</span>
              <span className="relative shrink-0 w-4 h-4 mt-1 lg:mt-0 lg:w-5 lg:h-5 transition-transform duration-700 ease-(--ease-expo) group-data-aberto/pergunta:rotate-45 motion-reduce:transition-none" aria-hidden="true">
                <span className="absolute inset-x-0 top-1/2 h-0.5 -mt-px bg-current" />
                <span className="absolute inset-y-0 left-1/2 w-0.5 -ml-px bg-current" />
              </span>
            </summary>
            <div
              className="resposta grid grid-rows-[1fr] js:data-fechada:grid-rows-[0fr] js:data-fechada:opacity-0 transition-[grid-template-rows,opacity] duration-700 ease-(--ease-expo) motion-reduce:transition-none"
              data-fechada={aqui ? undefined : ""}
              inert={hidratado && !aqui}
            >
              <div className="min-h-0 overflow-clip">
                <p className="max-w-[40ch] pb-5 pr-8 lg:max-w-[52ch] lg:pb-8 lg:pl-[72px] lg:pr-16 font-terciaria text-body wrap-anywhere">{resposta}</p>
              </div>
            </div>
          </details>
        );
      })}
    </div>
  );
}
