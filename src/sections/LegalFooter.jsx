import { DotField } from "../components/visuals/DotField.jsx";
import { CtaButton } from "../components/ui/CtaButton.jsx";
import { Label } from "../components/ui/Label.jsx";
import { Wordmark } from "../components/ui/Wordmark.jsx";
import { CONTENT } from "../content/content.js";
import { CONFIG, PUBLIC_CONTACT } from "../infra/config.js";
import { ENVELOPE, GRID_12 } from "../app/ui.js";
import { getDocumentUrl } from "../infra/validation.js";

/**
 * O rodape tem quatro blocos: `(e-mail)`, `(secoes)` (so ancoras da propria pagina),
 * `(documentos)` (politica e termos) e o aviso educativo, com o botao do verbo unico
 * em contorno. Nao ha telefone, redes nem newsletter: a pagina nao tem canal de voz,
 * perfil social nem coleta de e-mail para repassar. A faixa final em acento leva o wordmark.
 */
const SECTION_LINKS = [
  ["#inicio", "Início"],
  ["#espelho", "A troca de régua"],
  ["#prova", "A prova"],
  ["#oferta", "A oferta"],
  ["#objecoes", "Perguntas frequentes"],
];

// O rodape grande: o valor ao lado do rotulo, na medida do h2 (32px no monitor, a do h1).
const LARGE_VALUE =
  "font-secundaria text-h2 normal-case tracking-normal wrap-anywhere lg:text-[32px] lg:leading-[1.05]";

// `(e-mail) endereco` na mesma linha, o rotulo pequeno e o valor grande: o par do site de origem.
const PAIR = "flex flex-wrap items-baseline gap-x-4 gap-y-2 lg:flex-col lg:items-start lg:gap-2";
const LINK =
  "inline-flex max-w-full flex-wrap items-center gap-2 min-h-12 min-w-12 wrap-anywhere text-bone no-underline font-secundaria text-h3 hover:text-silver " +
  "transition-[color] duration-(--motion-fast) ease-(--ease-default)";

const LEGAL_DOCUMENTS = [
  ["Política de privacidade", getDocumentUrl(CONFIG.legal.politicaPrivacidade)],
  ["Termos de uso", getDocumentUrl(CONFIG.legal.termosDeUso)],
];

/**
 * Rodapé legal: e-mail, seções da página, documentos legais e o aviso educativo, com o botão do verbo único.
 * @param {object} props - Sem props.
 * @returns {JSX.Element} O rodapé da página.
 */
export function LegalFooter() {
  return (
    // data-oculta-doca: o rodape tem o proprio botao e a faixa de acento; a doca por cima dele seria o segundo acento na mesma tela.
    <footer id="rodape-legal" data-oculta-doca="" className="rodape relative overflow-clip bg-void text-silver border-t border-line">
      <DotField variant="estelar" />
      <div
        className={`${ENVELOPE} relative z-1 grid grid-cols-[1fr_1fr] gap-x-6 gap-y-12 pt-16 pb-12 lg:grid-cols-[repeat(12,1fr)] lg:gap-x-8 lg:pt-24 lg:pb-16`}
      >
        <address className="col-[1/-1] lg:col-[1/span_4] min-w-0 flex flex-col gap-4 not-italic">
          <dl className={PAIR}>
            <Label as="dt" margin="mb-0">e-mail</Label>
            <dd className={`${LARGE_VALUE} min-w-0 max-w-full`}>
              {PUBLIC_CONTACT ? (
                <a className="inline-flex min-h-12 min-w-12 max-w-full flex-wrap items-center wrap-anywhere text-acento" href={`mailto:${PUBLIC_CONTACT}`}>
                  {PUBLIC_CONTACT}
                </a>
              ) : (
                <span className="text-bone">Contato a confirmar</span>
              )}
            </dd>
          </dl>
        </address>

        <nav className="min-w-0 lg:col-[6/span_2]" aria-label="Seções da página">
          <Label margin="mb-3">seções</Label>
          <ul className="flex flex-col gap-2" role="list">
            {SECTION_LINKS.map(([href, name]) => (
              <li key={href}>
                <a className={LINK} href={href}>
                  {name}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <nav className="min-w-0 lg:col-[8/span_2]" aria-label="Documentos legais">
          <Label margin="mb-3">documentos</Label>
          <ul className="flex flex-col gap-2" role="list">
            {LEGAL_DOCUMENTS.map(([name, href]) => (
              <li key={name}>
                {href ? (
                  <a className={LINK} href={href}>
                    {/* Um item de flex so, com o espaco inseparavel: a seta acompanha a ultima palavra e nao quebra sozinha. */}
                    <span>{name}&nbsp;<span aria-hidden="true">&#8599;</span></span>
                  </a>
                ) : (
                  <span className="inline-flex min-h-12 max-w-full flex-wrap items-center wrap-anywhere font-secundaria text-h3">
                    {name} (documento pendente de aprovação)
                  </span>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <div className="col-[1/-1] lg:col-[10/-1] flex flex-col gap-4">
          <p className="max-w-prose font-terciaria text-caption">
            Este material é <strong>educativo</strong> e não substitui acompanhamento médico ou
            nutricional. Se você tem alguma condição de saúde, procure um profissional antes de
            começar qualquer programa de treino ou mudança alimentar.
          </p>
          <CtaButton position="rodape" isGhost isFullWidth />
        </div>
      </div>

      <div className={`${ENVELOPE} relative z-1 flex flex-wrap justify-between gap-x-6 gap-y-2 py-6 border-t border-line`}>
        <p className="font-terciaria text-mono-reg tabular-nums">&copy; {__ANO__} Lithium. Todos os direitos reservados.</p>
      </div>

      {/* A faixa: acento inundando, tinta por cima. O wordmark e SVG em currentColor; a
          tagline e display, texto grande, 3,77:1. */}
      <div className="relative z-1 overflow-clip py-16 lg:py-24 bg-acento text-void">
        <div className={`${ENVELOPE} flex flex-col gap-8 ${GRID_12} lg:items-end`}>
          <Wordmark isReference className="block w-full text-void lg:col-[1/span_7]" />
          <p className="self-end max-w-[14ch] lg:max-w-none text-right text-void font-secundaria text-display normal-case tracking-[-0.005em] leading-[1.02] lg:col-[9/-1]">
            {CONTENT.rodape.tagline}
          </p>
        </div>
      </div>
    </footer>
  );
}
