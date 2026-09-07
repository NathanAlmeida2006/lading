import { useEffect, useRef } from "react";
import { Rotulo } from "../components/Rotulo.jsx";
import { carimbar, revelar } from "../motion/index.js";
import { config } from "../config.js";

/**
 * A garantia, como selo carimbado.
 *
 * Em texto e na propria pagina, nunca em link (RF-L24). A persona ja pediu
 * reembolso de infoproduto antes (§10) e VAI checar se e facil (§13):
 * esconder a condicao aqui confirma a suspeita que ela ja traz.
 *
 * A forma e o carimbo do sistema: entra em tres degraus, e a unica peca da
 * pagina levemente fora do eixo, porque carimbo nunca cai reto. Cruz de
 * registro nos vertices e selo de versao no rodape sao micro-registro do §7.
 */
export function Garantia() {
  const raiz = useRef(null);
  const dias = config.oferta.garantiaDias;

  useEffect(() => {
    const no = raiz.current;
    if (!no) return;
    revelar(no.querySelector(".rotulo"));
    carimbar(no.querySelector(".selo"), { naRolagem: true, atraso: 120 });
  }, []);

  return (
    <section id="garantia" className="bloco garantia" data-theme="cartaz" ref={raiz}>
      <div className="envelope garantia__grade">
        <Rotulo>garantia</Rotulo>

        <div className="selo" data-revelar>
          <span className="selo__cruz selo__cruz--se" aria-hidden="true" />
          <span className="selo__cruz selo__cruz--sd" aria-hidden="true" />
          <span className="selo__cruz selo__cruz--ie" aria-hidden="true" />
          <span className="selo__cruz selo__cruz--id" aria-hidden="true" />

          <h2 className="selo__titulo display">Devolve.</h2>
          <p className="selo__texto body-lg prosa">
            {dias ? (
              <>
                Você tem <strong>{dias} dias</strong> pra ler e decidir. Não serviu, pede o reembolso por
                e-mail, em uma linha, e recebe de volta. Sem justificar.
              </>
            ) : (
              <>
                O prazo entra aqui, em texto, antes da página ir ao ar. Não serviu, pede o reembolso por
                e-mail, em uma linha, e recebe de volta. Sem justificar.
              </>
            )}
          </p>
          <p className="selo__texto body prosa">
            Não tem formulário de retenção, não tem ligação, e ninguém vai tentar te convencer do
            contrário.
          </p>
          <span className="selo__registro mono-reg">[reembolso por e-mail · sem retenção]</span>
        </div>
      </div>
    </section>
  );
}
