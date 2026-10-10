/** Diálogo acessível: conteúdo externo e três respostas inicialmente expostas. */
export function PerguntasFrequentes({ itens }) {
  return (
    <div className="dialogo flex flex-col gap-6 min-w-0 lg:col-[6/-1]">
      {itens.map(({ pergunta, resposta }) => (
        <details className="group/pergunta min-w-0" open key={pergunta} data-revelar>
          <summary className="relative ml-auto max-w-[30ch] lg:max-w-[36ch] min-h-12 pt-8 pr-4 pb-4 pl-6 text-right text-silver cursor-pointer wrap-anywhere">
            <span
              className="absolute -top-[0.05em] left-0 z-0 text-surface-2 pointer-events-none select-none font-secundaria font-extrabold uppercase tracking-[0.01em] leading-[0.8] tabular-nums text-[length:clamp(96px,30vw,200px)]"
              aria-hidden="true"
            >
              &ldquo;
            </span>
            <span className="relative z-1 font-secundaria text-h3 lg:text-[24px] lg:leading-[1.15]">{pergunta}</span>
          </summary>
          <div className="max-w-[44ch] lg:max-w-[52ch] px-6 py-4 lg:px-8 lg:py-6 border-l-2 border-acento bg-surface-1 wrap-anywhere">
            <span className="block mb-2 text-silver font-secundaria text-overline uppercase">parceiro de treino</span>
            <p className="max-w-prose font-terciaria text-body-lg">{resposta}</p>
          </div>
        </details>
      ))}
    </div>
  );
}
