import { Botao } from "../components/Botao.jsx";
import { Rotulo } from "../components/Rotulo.jsx";
import { Wordmark } from "../components/Wordmark.jsx";
import { config } from "../config.js";

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
 */
const SECOES = [
  ["#inicio", "Início"],
  ["#espelho", "A troca de régua"],
  ["#prova", "A prova"],
  ["#oferta", "A oferta"],
  ["#objecoes", "As três perguntas"],
];

export function RodapeLegal({ params }) {
  const { responsavel, documento, contato, politicaPrivacidade, termosDeUso } = config.legal;
  const ano = new Date().getFullYear();

  return (
    <footer className="rodape">
      <div className="envelope rodape__grade">
        <div className="rodape__contato">
          <p className="rodape__par">
            <Rotulo>e-mail</Rotulo>
            <a className="rodape__grande rodape__grande--acento h2" href={`mailto:${contato}`}>
              {contato}
            </a>
          </p>
          <p className="rodape__par">
            <Rotulo>responsável</Rotulo>
            <span className="rodape__grande h2">{responsavel}</span>
          </p>
        </div>

        <nav className="rodape__coluna" aria-label="Seções da página">
          <Rotulo>seções</Rotulo>
          <ul className="rodape__lista">
            {SECOES.map(([href, nome]) => (
              <li key={href}>
                <a className="rodape__link h3" href={href}>
                  {nome}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <nav className="rodape__coluna" aria-label="Documentos legais">
          <Rotulo>documentos</Rotulo>
          <ul className="rodape__lista">
            <li>
              <a className="rodape__link h3" href={politicaPrivacidade}>
                Política de privacidade <span aria-hidden="true">&#8599;</span>
              </a>
            </li>
            <li>
              <a className="rodape__link h3" href={termosDeUso}>
                Termos de uso <span aria-hidden="true">&#8599;</span>
              </a>
            </li>
          </ul>
        </nav>

        <div className="rodape__aviso">
          <p className="caption prosa">
            Este material é <strong>educativo</strong> e não substitui acompanhamento médico ou
            nutricional. Se você tem alguma condição de saúde, procure um profissional antes de
            começar qualquer programa de treino ou mudança alimentar.
          </p>
          <Botao params={params} posicao="rodape" fantasma />
        </div>
      </div>

      <div className="envelope rodape__base">
        <p className="mono-reg" data-num>
          &copy; {ano} Lithium. Todos os direitos reservados.
        </p>
        <p className="caption rodape__responsavel">
          {responsavel} &middot; <span data-num>{documento}</span>
        </p>
      </div>

      <div className="rodape__faixa">
        <div className="envelope rodape__faixa-grade">
          <Wordmark className="rodape__wordmark" />
          <p className="rodape__tagline display">O básico bem feito, provado, sem mágica.</p>
        </div>
      </div>
    </footer>
  );
}
