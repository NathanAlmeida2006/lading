import { GRAIN } from "../../app/ui.js";
import { DotField } from "../../components/visuals/DotField.jsx";
import { AppTrack } from "./AppTrack.jsx";
import { SessionCover } from "./SessionCover.jsx";
import { LithiumLogo, LOGO_URL } from "./LithiumLogo.jsx";
import { prepareModel } from "./Model3D.jsx";
import { TakeArsenal, TakeCalendar, TakeHook, TakeLoad, TakeDoIt, TakeL3D, TakeManifesto, TakeNumbers, TakeRecord } from "./Takes.jsx";
import { BEAT_MS, COVERS, STAGES, MUSIC_END, OBJECTS_3D, REPLAY_AFTER_MS } from "./timing.js";

const logo = new Image();

/**
 * Baixa e le os modelos antes do primeiro corte que os usa.
 * @returns {void}
 */
export function prepareModels() {
  // A logo e a mascara dos quadros de LithiumLogo: decodificada antes do corte, ela ja esta pronta no primeiro quadro. `logo` a segura na memoria.
  logo.src = LOGO_URL;
  logo.decode().catch(() => {});
  [...COVERS.map(({ model }) => model), ...OBJECTS_3D].forEach((model) => prepareModel(model).catch(() => {}));
}

/**
 * O que entra sobre o vermelho depois do clique: um chunk tardio, para nao pesar em quem nunca toca o video.
 * @param {object} props
 * @param {number} props.stage - Estágio atual do vídeo (ver STAGES em timing.js).
 * @param {object} props.schedule - Ref com a hora prevista de cada estágio.
 * @param {object} props.origin - Ref com a hora do clique (performance.now).
 * @param {() => void} props.onRepeat - Repete o vídeo.
 * @returns {JSX.Element} Os cortes do estágio atual.
 */
export default function Stage({ stage, schedule, origin, onRepeat }) {
  return (
    <>
      {stage === STAGES.hook && <TakeHook startAt={schedule.current[STAGES.hook]} />}
      {stage === STAGES.l3d && <TakeL3D startAt={schedule.current[STAGES.l3d]} />}
      {/* Um unico fundo (preto + malha de pontos) para a carga e as seis capas: ele nao remonta nos cortes, so a frente troca. O grao fica aqui, sobre o bg-void, para misturar com ele (overlay) como nas outras secoes; na capa, sem fundo proprio, ele clareava o preto.
          Remontar o canvas a cada corte dava um piscar de um quadro e reiniciava a onda. As frentes abaixo sao transparentes. */}
      {stage >= STAGES.load && stage < STAGES.track && (
        <div className={`${GRAIN} absolute inset-0 z-4 bg-void`} aria-hidden="true">
          <DotField variant="estelar" />
        </div>
      )}
      {stage === STAGES.load && <TakeLoad />}
      {stage >= STAGES.cover && stage < STAGES.track && <SessionCover {...COVERS[stage - STAGES.cover]} origin={origin.current} />}
      {stage === STAGES.track && <AppTrack duration={2 * BEAT_MS} startAt={schedule.current[STAGES.track]} />}
      {stage === STAGES.bridge && <TakeRecord startAt={schedule.current[STAGES.bridge]} />}
      {stage >= STAGES.logo && stage < STAGES.manifesto && <div className="absolute inset-0 z-4 bg-void" aria-hidden="true" />}
      {stage >= STAGES.logo && stage < STAGES.manifesto && <LithiumLogo frame={(stage - STAGES.logo) % 2} restartKey={stage} />}
      {stage === STAGES.manifesto && <TakeManifesto startAt={schedule.current[STAGES.manifesto]} />}
      {stage === STAGES.numbers && <TakeNumbers />}
      {stage === STAGES.calendar && <TakeCalendar />}
      {stage === STAGES.arsenal && <TakeArsenal startAt={schedule.current[STAGES.arsenal]} />}
      {stage === STAGES.doIt && <TakeDoIt onRepeat={onRepeat} replayAt={MUSIC_END.duration + REPLAY_AFTER_MS} />}
    </>
  );
}
