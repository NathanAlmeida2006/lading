import { Secao } from "../components/Secao.jsx";
import { config } from "../config.js";

/**
 * Garantia, em texto e na propria pagina, nunca em link (RF-L24).
 *
 * A persona ja pediu reembolso de infoproduto antes (§10) e VAI checar se e
 * facil (§13). Esconder a condicao aqui e a mesma coisa que confirmar a
 * suspeita que ela ja traz.
 */
export function Garantia() {
  const dias = config.oferta.garantiaDias;

  return (
    <Secao id="garantia" indice={7} tema="cartaz" kicker="Garantia" titulo="Se não servir, você pede de volta">
      <div className="garantia pilha">
        <p className="body-lg prosa">
          {dias ? (
            <>
              Você tem <strong>{dias} dias</strong> para ler e decidir. Se não
              servir, pede o reembolso e recebe de volta, sem precisar
              justificar.
            </>
          ) : (
            <>
              O prazo de garantia ainda não está definido. Ele entra aqui, em
              texto, antes da página ir ao ar.
            </>
          )}
        </p>
        <p className="body prosa">
          O pedido se faz por e-mail, em uma linha. Não tem formulário de
          retenção, não tem ligação, e ninguém vai tentar te convencer do
          contrário.
        </p>
      </div>
    </Secao>
  );
}
