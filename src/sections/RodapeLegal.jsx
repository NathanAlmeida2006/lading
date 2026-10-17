import { CampoDePontos } from "../components/CampoDePontos.jsx";
import { Botao } from "../components/Botao.jsx";
import { Rotulo } from "../components/Rotulo.jsx";
import { Wordmark } from "../components/Wordmark.jsx";
import { config } from "../config.js";
import { envelope } from "../ui.js";
import { emailReal, textoReal, urlDocumento } from "../validacao.js";

/**
 * O rodape, na forma do rodape do Nakula.
 *
 * Lido ao vivo em 07/09/2026: fundo escuro; uma grade de quatro colunas com
 * `(email)` e `(phone)` em tipografia grande, o e-mail no acento; `(links)` e
 * `(socials)` com setas; newsletter com botao em contorno. Abaixo, a linha do
 * copyright com politica e termos a esquerda e "made by" a direita. E,
 * fechando a pagina, uma faixa inteira no acento com o wordmark gigante a
 * esquerda e a tagline a direita.
 *
 * Aqui entra o que a pagina tem de verdade, e nada inventado:
 *
 *   - `(e-mail)` e `(responsavel)`, porque nao ha telefone (RNF-L24).
 *   - `(secoes)` em vez de links de rota: uma pagina, um destino (RF-L01), e
 *     toda ancora aponta para uma secao da propria pagina. Cinco, o teto do
 *     TR-14.
 *   - `(documentos)` em vez de redes: politica e termos, com a seta de quem
 *     sai da pagina. Perfil social inventado reprovaria.
 *   - O aviso educativo (RNF-L25) no lugar da newsletter, que coletaria dado
 *     que a pagina nao repassa (RNF-L26), e o botao do verbo unico em
 *     contorno onde o site de origem poe o "subscribe".
 *   - A faixa final e a unica inundacao de acento do rodape, com o wordmark
 *     da Marca e a linha do basico bem feito.
 *
 * No monitor: contato em 1 a 4, secoes em 6 e 7, documentos em 8 e 9, aviso em
 * 10 a 12. A coluna 5 e a calha. A doca some quando o rodape entra.
 */
const SECOES = [
  ["#inicio", "Início"],
  ["#espelho", "A troca de régua"],
  ["#prova", "A prova"],
  ["#oferta", "A oferta"],
  ["#objecoes", "Perguntas frequentes"],
];

// O rodape grande: o valor ao lado do rotulo, na medida do h2 (32px no monitor, a do h1).
const GRANDE =
  "font-secundaria text-h2 normal-case tracking-normal wrap-anywhere lg:text-[32px] lg:leading-[1.05]";

// `(e-mail) endereco` na mesma linha, o rotulo pequeno e o valor grande: o par do site de origem.
const PAR = "flex flex-wrap items-baseline gap-x-4 gap-y-2 lg:flex-col lg:items-start lg:gap-2";
const LINK =
  "inline-flex max-w-full flex-wrap items-center gap-2 min-h-12 min-w-12 wrap-anywhere text-bone no-underline font-secundaria text-h3 hover:text-silver " +
  "transition-[color] duration-(--motion-fast) ease-(--ease-default)";

// O valor publicado, aparado, ou `null` (a regra e a mesma do `PUBLICAR=1`: src/validacao.js).
const textoLegal = (valor) => (textoReal(valor) ? valor.trim() : null);

export function RodapeLegal() {
  const responsavel = textoLegal(config.legal.responsavel);
  const documento = textoLegal(config.legal.documento);
  const contato = emailReal(config.legal.contato) ? config.legal.contato.trim() : null;
  const documentos = [
    ["Política de privacidade", urlDocumento(config.legal.politicaPrivacidade)],
    ["Termos de uso", urlDocumento(config.legal.termosDeUso)],
  ];
  const ano = __ANO__;

  return (
    <footer id="rodape-legal" className="rodape relative overflow-clip bg-void text-silver border-t border-line">
      <CampoDePontos variante="estelar" />
      <div
        className={`${envelope} relative z-1 grid grid-cols-[1fr_1fr] gap-x-6 gap-y-12 pt-16 pb-12 lg:grid-cols-[repeat(12,1fr)] lg:gap-x-8 lg:pt-24 lg:pb-16`}
      >
        <address className="col-[1/-1] lg:col-[1/span_4] min-w-0 flex flex-col gap-4 not-italic">
          <dl className={PAR}>
            <Rotulo como="dt" margem="mb-0">e-mail</Rotulo>
            <dd className={`${GRANDE} min-w-0 max-w-full`}>
              {contato ? (
                <a className="inline-flex min-h-12 min-w-12 max-w-full flex-wrap items-center wrap-anywhere text-acento" href={`mailto:${contato}`}>
                  {contato}
                </a>
              ) : (
                <span className="text-bone">Contato a confirmar</span>
              )}
            </dd>
          </dl>
        </address>

        <nav className="min-w-0 lg:col-[6/span_2]" aria-label="Seções da página">
          <Rotulo margem="mb-3">seções</Rotulo>
          <ul className="flex flex-col gap-2" role="list">
            {SECOES.map(([href, nome]) => (
              <li key={href}>
                <a className={LINK} href={href}>
                  {nome}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <nav className="min-w-0 lg:col-[8/span_2]" aria-label="Documentos legais">
          <Rotulo margem="mb-3">documentos</Rotulo>
          <ul className="flex flex-col gap-2" role="list">
            {documentos.map(([nome, href]) => (
              <li key={nome}>
                {href ? (
                  <a className={LINK} href={href}>
                    {nome} <span aria-hidden="true">&#8599;</span>
                  </a>
                ) : (
                  <span className="inline-flex min-h-12 max-w-full flex-wrap items-center wrap-anywhere font-secundaria text-h3">
                    {nome} (documento pendente de aprovação)
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
          <Botao posicao="rodape" fantasma larguraTotal />
        </div>
      </div>

      <div className={`${envelope} relative z-1 flex flex-wrap justify-between gap-x-6 gap-y-2 py-6 border-t border-line`}>
        <p className="font-terciaria text-mono-reg tabular-nums">&copy; {ano} Lithium. Todos os direitos reservados.</p>
        <p className="font-terciaria text-caption">
          {responsavel ?? "Responsável a confirmar"} &middot; <span className="tabular-nums">{documento ?? "Documento a confirmar"}</span>
        </p>
      </div>

      {/* A faixa: acento inundando, tinta por cima. O wordmark e SVG em currentColor; a
          tagline e display, texto grande, 3,77:1. */}
      <div className="relative z-1 overflow-clip py-16 lg:py-24 bg-acento text-void">
        <div className={`${envelope} flex flex-col gap-8 lg:grid lg:grid-cols-[repeat(12,1fr)] lg:gap-x-8 lg:items-end`}>
          <Wordmark referencia className="block w-full text-void lg:col-[1/span_7]" />
          <p className="self-end max-w-[14ch] lg:max-w-none text-right text-void font-secundaria text-display normal-case tracking-[-0.005em] leading-[1.02] lg:col-[9/-1]">
            O básico bem feito, provado, sem mágica.
          </p>
        </div>
      </div>
    </footer>
  );
}
