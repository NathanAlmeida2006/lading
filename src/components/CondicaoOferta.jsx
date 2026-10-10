/**
 * @typedef {Object} CondicaoComercial
 * @property {string} texto Termos comerciais aprovados.
 * @property {string} fonte Referência factual; não publicada pelo componente.
 * @property {string} inicio Instante absoluto em RFC3339 com offset.
 * @property {string} fim Instante absoluto em RFC3339 com offset.
 * @property {string} fuso Fuso IANA dos horários apresentados.
 * @property {string} referenciaComercial Lastro da condição.
 * @property {true} confirmado
 * @property {string} dataConfirmacao
 * @property {string} identificadorCheckout
 */

/**
 * Apresenta apenas uma condição já validada pelo integrador.
 * O estado neutro é usado no HTML estático e na primeira hidratação.
 * @param {{ condicao: CondicaoComercial | null, estado: 'neutra' | 'agendada' | 'vigente' | 'encerrada' }} props
 */
export function CondicaoOferta({ condicao, estado }) {
  if (!condicao) return null;

  const formato = new Intl.DateTimeFormat("pt-BR", {
    timeZone: condicao.fuso,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const inicio = formato.format(new Date(condicao.inicio));
  const fim = formato.format(new Date(condicao.fim));
  const encerrada = estado === "encerrada";

  return (
    <aside
      aria-label="Condição comercial datada"
      className="mt-8 p-4 border border-line-strong min-w-0 wrap-anywhere"
      data-condicao-oferta
      data-estado={estado}
    >
      <div aria-live="polite" aria-atomic="true">
        <h3 className="text-silver font-secundaria text-overline uppercase">
          {encerrada ? "condição comercial encerrada" : "condição comercial datada"}
        </h3>
        {encerrada ? (
          <p className="mt-2 text-bone font-terciaria text-body lg:text-body-lg">
            Esta condição foi encerrada em <time dateTime={condicao.fim}>{fim}</time>.
          </p>
        ) : (
          <>
            <p className="mt-2 text-bone font-terciaria text-body lg:text-body-lg">{condicao.texto}</p>
            {estado === "agendada" ? (
              <p className="mt-2 text-silver font-terciaria text-body">O período informado ainda não começou.</p>
            ) : estado === "vigente" ? (
              <p className="mt-2 text-silver font-terciaria text-body">Período em andamento.</p>
            ) : null}
          </>
        )}
      </div>

      <dl className="flex flex-col gap-3 mt-4 font-terciaria text-body text-bone">
        <div>
          <dt className="text-silver font-secundaria text-overline uppercase">início do período</dt>
          <dd className="mt-2 tabular-nums"><time dateTime={condicao.inicio}>{inicio}</time></dd>
        </div>
        <div>
          <dt className="text-silver font-secundaria text-overline uppercase">fim do período</dt>
          <dd className="mt-2 tabular-nums"><time dateTime={condicao.fim}>{fim}</time></dd>
        </div>
        <div>
          <dt className="text-silver font-secundaria text-overline uppercase">fuso dos horários</dt>
          <dd className="mt-2">{condicao.fuso}</dd>
        </div>
      </dl>

      <p className="mt-4 pt-4 border-t border-line text-silver font-terciaria text-caption">
        A Ticto confirma a disponibilidade e as condições aplicáveis à compra no checkout. Esta página não consulta estoque em tempo real.
      </p>
    </aside>
  );
}
