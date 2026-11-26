import { DotField } from "../../components/visuals/DotField.jsx";
import { AppScreen } from "./AppScreen.jsx";
import "../../styles/app-screens.css";

/**
 * A tela Trilha do app Lithium (hipertrofia, sem progresso). O HTML e o CSS saem do app em execução (390 px,
 * `app-lithium/src/telas/Trilha.jsx` + Casca), sem a barra de navegação e sem o objeto 3D e o que vem depois;
 * o CSS vive em styles/app-screens.css, restrito a `.app-track` (prefixo de seletor). A rolagem é a de AppScreen: do topo até o meio do mapa, em `duration` ms.
 * @param {object} props
 * @param {number} props.duration - Tempo da rolagem, em ms.
 * @param {(speed: number) => void} [props.onMeasure] - Recebe a velocidade medida, em px/s.
 * @param {number} props.startAt - Hora (performance.now) em que o estágio devia entrar.
 * @returns {JSX.Element} A tela Trilha, rolada até o quarto nó do mapa.
 */
// A Trilha rola até o quarto nó do mapa chegar a 300 px do topo e para: o corte seguinte é a ponte (TakeRecord), não mais o Registro.
export function AppTrack({ duration, onMeasure, startAt }) {
  return (
    <AppScreen
      scope="app-track"
      to={{ target: ".roadmap-step:nth-child(4) .roadmap-node", y: 300 }}
      duration={duration}
      onMeasure={onMeasure}
      startAt={startAt}
    >
      <div className="app-shell" data-pilar="hipertrofia">
        <div className="app-body">
          <header className="bar-top">
            <a className="mark-top" aria-label="Lithium, início">
              <img
                className="wordmark"
                alt=""
                width="104"
                height="28"
                src="/lithium-wordmark.svg"
              />
            </a>
            <div className="bar-actions">
              <a className="button-icon" aria-label="Social Vibe" title="Social Vibe">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="square"
                  strokeLinejoin="miter"
                  aria-hidden="true"
                >
                  <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"></path>
                </svg>
              </a>
            </div>
          </header>
          <main tabIndex="-1" data-rota="trilha/hipertrofia">
            <div className="today-screen track-screen">
              <header className="note-cover">
                <DotField />
                <div className="note-envelope">
                  <div className="note-heading">
                    <p className="overtitle">(protocolos)</p>
                    <h1 tabIndex="-1" data-revelar="">
                      Trilha.
                    </h1>
                    <p className="copy-secondary">Cada protocolo, passo a passo.</p>
                  </div>
                  <nav className="tabs-pillars" aria-label="Protocolos" data-revelar="">
                    <a aria-current="page">
                      <svg
                        width="22"
                        height="22"
                        viewBox="0.79 0.79 22.41 22.41"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.401"
                        strokeLinecap="square"
                        strokeLinejoin="miter"
                        aria-hidden="true"
                      >
                        <path d="M3 8v8M6 5v14M18 5v14M21 8v8M6 12h12"></path>
                      </svg>
                      Hipertrofia
                    </a>
                    <a>
                      <svg
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="square"
                        strokeLinejoin="miter"
                        aria-hidden="true"
                      >
                        <path d="M5 3v7M2 3v4a3 3 0 0 0 6 0V3M5 10v11M19 3c-5 4-5 9 0 9V3v18"></path>
                      </svg>
                      Dieta
                    </a>
                    <a>
                      <svg
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="square"
                        strokeLinejoin="miter"
                        aria-hidden="true"
                      >
                        <path d="M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11Z"></path>
                      </svg>
                      Sono
                    </a>
                  </nav>
                  <a className="button primary track-continue">
                    <span>Começar: Abertura</span>
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="square"
                      strokeLinejoin="miter"
                      aria-hidden="true"
                    >
                      <path d="M5 12h14M13 6l6 6-6 6"></path>
                    </svg>
                  </a>
                </div>
              </header>
              <section
                className="ruler-block map-panel"
                aria-label="Mapa de Hipertrofia"
                data-revelar=""
              >
                <DotField variant="estelar" />
                <div className="ruler-grid">
                  <div className="map-core">
                    <ol className="roadmap">
                      <li className="roadmap-step next" data-revelar="">
                        <span className="map-milestone" data-state="next" aria-hidden="true"></span>
                        <a className="roadmap-node" aria-label="Abertura. Próxima">
                          <span className="roadmap-index">00</span>
                          <span className="roadmap-state">Próxima · você está aqui</span>
                          <strong className="roadmap-name">Abertura</strong>
                          <span className="roadmap-detail">Seu ponto de partida</span>
                          <svg
                            width="22"
                            height="22"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="square"
                            strokeLinejoin="miter"
                            aria-hidden="true"
                          >
                            <path d="M5 12h14M13 6l6 6-6 6"></path>
                          </svg>
                        </a>
                      </li>
                      <li className="roadmap-step blocked" data-revelar="">
                        <span
                          className="map-milestone"
                          data-state="blocked"
                          aria-hidden="true"
                        ></span>
                        <div className="roadmap-node">
                          <span className="roadmap-index">01</span>
                          <span className="roadmap-state">Fechada</span>
                          <strong className="roadmap-name">Sua primeira vitória</strong>
                          <span className="roadmap-detail">Ler a 00 primeiro</span>
                        </div>
                      </li>
                      <li className="roadmap-step blocked" data-revelar="">
                        <span
                          className="map-milestone"
                          data-state="blocked"
                          aria-hidden="true"
                        ></span>
                        <div className="roadmap-node">
                          <span className="roadmap-index">02</span>
                          <span className="roadmap-state">Fechada</span>
                          <strong className="roadmap-name">Como o músculo cresce</strong>
                          <span className="roadmap-detail">Ler a 01 e mais 1 treino</span>
                        </div>
                      </li>
                      <li className="roadmap-step blocked" data-revelar="">
                        <span
                          className="map-milestone"
                          data-state="blocked"
                          aria-hidden="true"
                        ></span>
                        <div className="roadmap-node">
                          <span className="roadmap-index">03</span>
                          <span className="roadmap-state">Fechada</span>
                          <strong className="roadmap-name">O programa</strong>
                          <span className="roadmap-detail">Ler a 02 e mais 2 treinos</span>
                        </div>
                      </li>
                      <li className="roadmap-step blocked" data-revelar="">
                        <span
                          className="map-milestone"
                          data-state="blocked"
                          aria-hidden="true"
                        ></span>
                        <div className="roadmap-node">
                          <span className="roadmap-index">04</span>
                          <span className="roadmap-state">Fechada</span>
                          <strong className="roadmap-name">Execução sem medo</strong>
                          <span className="roadmap-detail">Ler a 03 e mais 3 treinos</span>
                        </div>
                      </li>
                      <li className="roadmap-step blocked" data-revelar="">
                        <span
                          className="map-milestone"
                          data-state="blocked"
                          aria-hidden="true"
                        ></span>
                        <div className="roadmap-node">
                          <span className="roadmap-index">05</span>
                          <span className="roadmap-state">Fechada</span>
                          <strong className="roadmap-name">Progressão no piloto automático</strong>
                          <span className="roadmap-detail">Ler a 04 e mais 4 treinos</span>
                        </div>
                      </li>
                      <li className="roadmap-step blocked" data-revelar="">
                        <span
                          className="map-milestone"
                          data-state="blocked"
                          aria-hidden="true"
                        ></span>
                        <div className="roadmap-node">
                          <span className="roadmap-index">06</span>
                          <span className="roadmap-state">Fechada</span>
                          <strong className="roadmap-name">O caderno de vitórias</strong>
                          <span className="roadmap-detail">Ler a 05 e mais 5 treinos</span>
                        </div>
                      </li>
                      <li className="roadmap-step blocked" data-revelar="">
                        <span
                          className="map-milestone"
                          data-state="blocked"
                          aria-hidden="true"
                        ></span>
                        <div className="roadmap-node">
                          <span className="roadmap-index">07</span>
                          <span className="roadmap-state">Fechada</span>
                          <strong className="roadmap-name">O plano de retorno</strong>
                          <span className="roadmap-detail">Ler a 06 e mais 6 treinos</span>
                        </div>
                      </li>
                      <li className="roadmap-step blocked" data-revelar="">
                        <span
                          className="map-milestone"
                          data-state="blocked"
                          aria-hidden="true"
                        ></span>
                        <div className="roadmap-node">
                          <span className="roadmap-index">08</span>
                          <span className="roadmap-state">Fechada</span>
                          <strong className="roadmap-name">Seu arco começa agora</strong>
                          <span className="roadmap-detail">Ler a 07 e mais 7 treinos</span>
                        </div>
                      </li>
                      <li className="roadmap-step blocked" data-revelar="">
                        <span
                          className="map-milestone"
                          data-state="blocked"
                          aria-hidden="true"
                        ></span>
                        <div className="roadmap-node">
                          <span className="roadmap-index">09</span>
                          <span className="roadmap-state">Fechada</span>
                          <strong className="roadmap-name">Fechamento</strong>
                          <span className="roadmap-detail">Ler a 08 e mais 8 treinos</span>
                        </div>
                      </li>
                    </ol>
                  </div>
                </div>
              </section>
            </div>
          </main>
        </div>
        <div className="notice-floating" role="status"></div>
      </div>
    </AppScreen>
  );
}
