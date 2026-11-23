import { ENVELOPE } from "../../app/ui.js";

// O rastro: 120 px de fio que se apaga, com um quadrado na ponta (o marcador da Trilha do app). Strings completas, para o Tailwind ver.
const BONE = "bg-[linear-gradient(to_bottom,color-mix(in_srgb,var(--bone)_55%,transparent),transparent_120px)] before:bg-bone";
const RED = "bg-[linear-gradient(to_bottom,color-mix(in_srgb,var(--acento)_80%,transparent),transparent_120px)] before:bg-acento";

// Os cinco trilhos, nos quartos da coluna da pagina (no lg, as colunas 0, 3, 6, 9 e 12 da grade). Abaixo do lg ficam so os das pontas:
// os de dentro cortariam o titulo e a legenda. `seconds` e a volta inteira (so metade dela o rastro esta na secao), `delay` e negativo
// para ja pegar cada um no meio do caminho, e as duracoes diferentes impedem que os trilhos voltem a andar em fila. Cada trilho leva
// dois rastros, defasados em meia volta, para que nunca fique vazio.
const RAILS = [
  { seconds: 34, delay: -6, tone: BONE },
  { seconds: 28, delay: -17, tone: BONE },
  { seconds: 40, delay: -29, tone: RED },
  { seconds: 31, delay: -3, tone: BONE },
  { seconds: 37, delay: -22, tone: RED },
];

/**
 * O fundo da secao do app: trilhos verticais de fio fino, e por cada um sobe devagar um rastro com um quadrado na ponta, como o
 * progresso da Trilha. So `transform` (o rastro tem a altura do trilho e anda de +100% a -100% de si mesmo, entao a conta e em
 * porcentagem e nao depende da altura da secao). Sem blur, sem brilho. Sob movimento reduzido os rastros somem e ficam so os fios;
 * a pausa do visitante (`data-pausado`) para tudo pelo CSS global.
 * @param {object} props
 * @param {boolean} props.isRunning - Falso para parar os rastros (secao fora da tela).
 * @returns {JSX.Element} A camada, atras do conteudo da secao.
 */
export function Trilhos({ isRunning }) {
  return (
    <div className={`${ENVELOPE} pointer-events-none absolute inset-x-0 inset-y-0`} aria-hidden="true">
      <div className="relative h-full">
        {RAILS.map(({ seconds, delay, tone }, index) => (
          <div
            key={seconds}
            className={`absolute inset-y-0 w-px bg-line ${index > 0 && index < RAILS.length - 1 ? "max-lg:hidden" : ""}`}
            style={{ left: `${index * 25}%` }}
          >
            {[0, 0.5].map((phase) => (
              <div
                key={phase}
                className={`absolute inset-0 animate-trilho motion-reduce:hidden before:absolute before:top-0 before:left-1/2 before:size-[5px] before:-translate-x-1/2 ${tone}`}
                style={{ animationDuration: `${seconds}s`, animationDelay: `${delay - phase * seconds}s`, animationPlayState: isRunning ? "running" : "paused" }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
