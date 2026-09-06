import { config } from "../config.js";

/**
 * Rodape legal.
 *
 * O aviso de que o conteudo e educativo e nao substitui acompanhamento medico
 * ou nutricional e obrigatorio em toda pagina (RNF-L25), e nao e formalidade:
 * a categoria e sensivel na plataforma e o assunto e o corpo de quem le.
 */
export function RodapeLegal() {
  const { responsavel, documento, contato, politicaPrivacidade, termosDeUso } =
    config.legal;

  return (
    <footer className="rodape">
      <div className="envelope">
        <p className="rodape__aviso caption prosa">
          Este material é <strong>educativo</strong> e não substitui
          acompanhamento médico ou nutricional. Se você tem alguma condição de
          saúde, procure um profissional antes de começar qualquer programa de
          treino ou mudança alimentar.
        </p>

        <nav className="rodape__links caption" aria-label="Documentos legais">
          <a href={politicaPrivacidade}>Política de privacidade</a>
          <a href={termosDeUso}>Termos de uso</a>
          <a href={`mailto:${contato}`}>Contato</a>
        </nav>

        <p className="caption">
          {responsavel} &middot; <span data-num>{documento}</span>
        </p>
      </div>
    </footer>
  );
}
