import { useEffect, useState } from "react";
import { padTwoDigits } from "../../app/ui.js";
import { trackFaqOpen } from "../../infra/instrumentation.js";

/** Cada pergunta da lista de dúvidas, em forma de acordeão. */
const FAQ_ITEM =
  "group/pergunta relative isolate min-w-0 border-b border-line-strong first:border-t data-aberto:text-void " +
  "transition-colors duration-700 ease-(--ease-expo) before:content-[''] before:absolute before:inset-y-0 " +
  "before:-inset-x-4 before:-z-10 before:bg-accent before:opacity-0 data-aberto:before:opacity-100 " +
  "before:transition-opacity before:duration-700 before:ease-(--ease-expo)";

/**
 * FAQ em acordeão, no layout do Rep Republic: pergunta e marca de mais/menos numa linha com fio
 * embaixo; o item aberto vira um bloco cheio em acento. Todos nascem fechados, e só um abre por vez.
 *
 * O estado é um só, `aberto` (o índice do item aberto), e o movimento e CSS: a altura da resposta
 * vai de `0fr` a `1fr` e o fundo em acento esmaece. Nenhum nó é medido, clonado ou escrito na mão,
 * e nada fora da lista se move por transform, então não há o que piscar ou quebrar ao rolar.
 *
 * Sem JS as respostas ficam abertas, porque só a regra de `js:` as recolhe. O botão alterna o estado;
 * `aria-expanded` e `inert` dizem a verdade a leitores de tela e ao teclado.
 * @param {object} props
 * @param {{question: string, answer: string}[]} props.items - Perguntas e respostas, com as chaves do JSON de conteúdo.
 * @returns {JSX.Element}
 */
export function Faq({ items }) {
  const [openIndex, setOpenIndex] = useState(-1);
  // `inert` só depois da hidratação: sem JS as respostas ficam expostas e selecionáveis.
  const [isHydrated, setIsHydrated] = useState(false);
  useEffect(() => setIsHydrated(true), []);

  return (
    <div className="dialog flex flex-col min-w-0">
      {items.map(({ question, answer }, index) => {
        const isOpen = index === openIndex;
        return (
          <div
            className={FAQ_ITEM}
            key={question}
            data-aberto={isOpen ? "" : undefined}
            data-revelar
          >
            <button
              type="button"
              className="flex w-full items-start justify-between gap-4 py-5 text-left cursor-pointer font-secondary text-h3 wrap-anywhere lg:items-center lg:gap-8 lg:py-7 lg:text-h2"
              aria-expanded={isOpen}
              onClick={() => {
                if (!isOpen) trackFaqOpen(index + 1);
                setOpenIndex(isOpen ? -1 : index);
              }}
            >
              <span
                className="hidden lg:block w-10 shrink-0 font-tertiary text-body tabular-nums opacity-60"
                aria-hidden="true"
              >
                {padTwoDigits(index + 1)}
              </span>
              {/* A pergunta quebra em quantas linhas precisar: a maior passa de 80 caracteres, e uma linha só a estouraria em 360px. */}
              <span className="min-w-0 flex-1">{question}</span>
              <span
                className="relative shrink-0 w-4 h-4 mt-1 lg:mt-0 lg:w-5 lg:h-5 transition-transform duration-700 ease-(--ease-expo) group-data-aberto/pergunta:rotate-45"
                aria-hidden="true"
              >
                <span className="absolute inset-x-0 top-1/2 h-0.5 -mt-px bg-current" />
                <span className="absolute inset-y-0 left-1/2 w-0.5 -ml-px bg-current" />
              </span>
            </button>
            <div
              className="resposta grid grid-rows-[1fr] js:data-fechada:grid-rows-[0fr] js:data-fechada:opacity-0 transition-[grid-template-rows,opacity] duration-700 ease-(--ease-expo)"
              data-fechada={isOpen ? undefined : ""}
              inert={isHydrated && !isOpen}
            >
              <div className="min-h-0 overflow-clip">
                <p className="max-w-[40ch] pb-5 pr-8 lg:max-w-[52ch] lg:pb-8 lg:pl-[72px] lg:pr-16 font-tertiary text-body text-justify wrap-anywhere">
                  {answer}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
