/**
 * O relogio e o roteiro do video: a musica (source-media/apex.mp3, a partir dos 21 s do arquivo; `apex-video.mp3` e esse trecho, mais leve) tem
 * 119 BPM e o "drop", a primeira batida forte, em 24,23 s do arquivo, ou seja, 3,23 s depois de ela comecar. Todo corte do video cai
 * numa batida: `getBeatTime(n)` e o instante, em ms depois do clique, da batida `n` contada a partir do drop.
 *
 * Para refazer o trecho com outro inicio: ffmpeg -ss <inicio> -t 36 -i source-media/apex.mp3 -vn -c:a libmp3lame -b:a 160k public/audio/apex-video.mp3
 * e ajuste `DROP_MS` (o drop, em s, menos o inicio) e `BEAT_MS`. O arquivo inteiro vai para a memoria ao decodificar, entao ele so tem o que toca: precisa cobrir
 * `getBeatTime(DO_IT_BEAT)` + `MUSIC_END.duration` (este arquivo), hoje 35,96 s (o arquivo tem 36,05 s). Se a linha do tempo crescer, aumente o `-t`.
 */
export const BEAT_MS = 504.2; // ms entre batidas (119 BPM)
export const DROP_MS = 3230; // ms depois do clique em que cai o drop
/**
 * Instante, em ms depois do clique, da batida n contada a partir do drop.
 * @param {number} n - Número da batida, contado a partir do drop.
 * @returns {number} Milissegundos depois do clique.
 */
export const getBeatTime = (n) => DROP_MS + n * BEAT_MS;
/**
 * Quanto falta (ms) para `ms` depois de `startAt` (a hora em que o estagio devia entrar): os takes trocam de quadro por aqui, e nao `ms` depois de montarem, que atrasaria tudo o que o React demorou para montar.
 * @param {number|undefined} startAt - Hora (performance.now) em que o estágio devia entrar.
 * @param {number} ms - Tempo depois de startAt, em ms.
 * @returns {number} Milissegundos que faltam, nunca negativos.
 */
export const getDelay = (startAt, ms) => Math.max(0, (startAt ?? performance.now()) + ms - performance.now());
export const MUSIC_URL = "/audio/apex-video.mp3";
export const FINAL_EFFECT_URL = "/audio/rdr.mp3"; // o efeito sonoro que abre o ultimo take

const SESSION = ["Sua primeira", "vitória"];
const RED = { accent: "var(--rubro)", color: "#d2202c", onAccent: "var(--bone-pure)" };
// As capas, todas em corte seco (sem transicao nem animacao) e estaticas: so o objeto 3D muda (e flutua livre, num giro so que segue de uma para a outra, `origin`). As tres primeiras sao a
// capa da primeira sessao de cada trilha do app Lithium (`readings` e o numero de leituras da sessao 01 no catalogo do app); as tres
// seguintes sao o painel com que abrem as abas da EU (Semana, Corpo e Social Vibe), sem botao nem numeros e sem os menus do app.
export const COVERS = [
  { kicker: "Hipertrofia · sessão 01", lines: SESSION, model: "dumbbell", ...RED, readings: 3 },
  { kicker: "Dieta básica · sessão 01", lines: SESSION, model: "apple", accent: "var(--praga)", color: "#12a150", onAccent: "var(--void)", readings: 2 },
  { kicker: "Cuidado com o sono · sessão 01", lines: SESSION, model: "half-moon", accent: "var(--vigilia)", color: "#8b5cf6", onAccent: "var(--void)", readings: 1 },
  { kicker: "semana", lines: ["Semana"], model: "medal", ...RED, hasAction: false },
  { kicker: "corpo", lines: ["Corpo"], model: "profile", ...RED, hasAction: false },
  { kicker: "social vibe", lines: ["Social", "Vibe"], model: "bolt", ...RED, hasAction: false },
];

/**
 * Os estagios do video, na ordem: o L em 3D, a carga, as capas, a Trilha, a ponte (TakeRecord), os quatro quadros
 * da logo e os takes finais.
 */
export const STAGES = { l3d: 0, load: 1, cover: 2, track: 2 + COVERS.length, bridge: 3 + COVERS.length, logo: 4 + COVERS.length, manifesto: 8 + COVERS.length, numbers: 9 + COVERS.length, calendar: 10 + COVERS.length, arsenal: 11 + COVERS.length, doIt: 12 + COVERS.length };

/**
 * A linha do tempo, em batidas contadas do drop da musica (timing.js): [beat, stage]. O drop abre o L em 3D (6 batidas) e
 * a carga (4); cada capa (as tres sessoes e as tres abas da EU) dura 1 batida (0,5 s); a Trilha e a ponte ("Registre agora."), 2 cada (1 s); a logo bate quatro vezes, uma por batida (o take do Registro rolando
 * foi cortado: tudo o que vem depois andou 4 batidas, um compasso, para tras e segue na grade da musica); os takes finais duram 8, 6, 6 e 6
 * batidas; o ultimo fica, e a musica se apaga a partir da entrada dele (5,5 s).
 */
export const DO_IT_BEAT = 50; // o ultimo take ("Apenas faca.") entra na batida 50
export const TIMELINE = [[0, STAGES.l3d], [6, STAGES.load], ...COVERS.map((_, i) => [10 + i, STAGES.cover + i]), [16, STAGES.track], [18, STAGES.bridge], [20, STAGES.logo], [21, STAGES.logo + 1], [22, STAGES.logo + 2], [23, STAGES.logo + 3], [24, STAGES.manifesto], [32, STAGES.numbers], [38, STAGES.calendar], [44, STAGES.arsenal], [DO_IT_BEAT, STAGES.doIt]];
export const MUSIC_END = { beat: DO_IT_BEAT, duration: 5500 }; // a musica comeca a se apagar quando o ultimo take entra e some em 5,5 s (1,5 s a menos que antes)
export const REPLAY_AFTER_MS = 2000; // o botao de replay surge 2 s depois de a musica parar

/** Os objetos 3D do app, na ordem em que o take do L 3D os passa, e o `prepareModel` deles (Stage.jsx baixa tudo no clique). */
export const OBJECTS_3D = ["letter-l", "bolt", "gear", "sword", "medal", "clock", "profile", "cross", "lithium"];

/** Os capitulos da barra de progresso (Timeline.jsx): [nome, estagio em que comecam]. Cada um vai ate o comeco do proximo. */
export const CHAPTERS = [["Abertura", STAGES.l3d], ["O app", STAGES.cover], ["A marca", STAGES.logo], ["Manifesto", STAGES.manifesto], ["Os números", STAGES.numbers], ["Arsenal", STAGES.arsenal], ["Faça", STAGES.doIt]];
/** Da hora do clique ate a musica se apagar, em ms: a duracao da barra de progresso. */
export const VIDEO_MS = getBeatTime(DO_IT_BEAT) + MUSIC_END.duration;
