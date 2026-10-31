/**
 * O relogio e o roteiro do video: a musica (midia-fonte/apex.mp3, a partir dos 21 s do arquivo; `apex-video.mp3` e esse trecho, mais leve) tem
 * 119 BPM e o "drop", a primeira batida forte, em 24,23 s do arquivo, ou seja, 3,23 s depois de ela comecar. Todo corte do video cai
 * numa batida: `batida(n)` e o instante, em ms depois do clique, da batida `n` contada a partir do drop.
 *
 * Para refazer o trecho com outro inicio: ffmpeg -ss <inicio> -t 36 -i midia-fonte/apex.mp3 -vn -c:a libmp3lame -b:a 160k public/apex-video.mp3
 * e ajuste `DROP` (o drop, em s, menos o inicio) e `BATIDA`. O arquivo inteiro vai para a memoria ao decodificar, entao ele so tem o que toca: precisa cobrir
 * `batida(BATIDA_FACA)` + `FIM_DA_MUSICA.duracao` (este arquivo), hoje 34,95 s. Se a linha do tempo crescer, aumente o `-t`.
 */
export const BATIDA = 504.2; // ms entre batidas (119 BPM)
export const DROP = 3230; // ms depois do clique em que cai o drop
export const batida = (n) => DROP + n * BATIDA;
/** Quanto falta (ms) para `ms` depois de `inicioEm` (a hora em que o estagio devia entrar): os takes trocam de quadro por aqui, e nao `ms` depois de montarem, que atrasaria tudo o que o React demorou para montar. */
export const atraso = (inicioEm, ms) => Math.max(0, (inicioEm ?? performance.now()) + ms - performance.now());
export const MUSICA = "/apex-video.mp3";
export const EFEITO_FINAL = "/rdr.mp3"; // o efeito sonoro que abre o ultimo take

const SESSAO = ["Sua primeira", "vitória"];
const VERMELHO = { acento: "var(--rubro)", cor: "#d2202c", sobre: "var(--bone-pure)" };
// As capas, todas em corte seco (sem transicao nem animacao) e estaticas: so o objeto 3D muda (e flutua livre, num giro so que segue de uma para a outra, `origem`). As tres primeiras sao a
// capa da primeira sessao de cada trilha do app Lithium (`leituras` e o numero de leituras da sessao 01 no catalogo do app); as tres
// seguintes sao o painel com que abrem as abas da EU (Semana, Corpo e Social Vibe), sem botao nem numeros e sem os menus do app.
export const CAPAS = [
  { kicker: "Hipertrofia · sessão 01", linhas: SESSAO, modelo: "haltere", ...VERMELHO, leituras: 3 },
  { kicker: "Dieta básica · sessão 01", linhas: SESSAO, modelo: "maca", acento: "var(--praga)", cor: "#12a150", sobre: "var(--void)", leituras: 2 },
  { kicker: "Cuidado com o sono · sessão 01", linhas: SESSAO, modelo: "meia-lua", acento: "var(--vigilia)", cor: "#8b5cf6", sobre: "var(--void)", leituras: 1 },
  { kicker: "semana", linhas: ["Semana"], modelo: "medalha", ...VERMELHO, acao: false },
  { kicker: "corpo", linhas: ["Corpo"], modelo: "perfil", ...VERMELHO, acao: false },
  { kicker: "social vibe", linhas: ["Social", "Vibe"], modelo: "raio", ...VERMELHO, acao: false },
];

/**
 * Os estagios do video, na ordem: o L em 3D, a carga, as capas, a Trilha, o Registro, a mascara da logo, os quatro quadros
 * da logo e os takes finais.
 */
export const ESTAGIOS = { l3d: 0, carga: 1, capa: 2, trilha: 2 + CAPAS.length, registro: 3 + CAPAS.length, mascara: 4 + CAPAS.length, logo: 5 + CAPAS.length, manifesto: 9 + CAPAS.length, numeros: 10 + CAPAS.length, calendario: 11 + CAPAS.length, arsenal: 12 + CAPAS.length, faca: 13 + CAPAS.length };

/**
 * A linha do tempo, em batidas contadas do drop da musica (tempo.js): [batida, estagio]. O drop abre o L em 3D (6 batidas) e
 * a carga (4); cada capa (as tres sessoes e as tres abas da EU) dura 1 batida (0,5 s); a Trilha e o Registro, 2 (1 s); o Registro vira recheio da
 * logo na batida 19 (a mascara leva 2) e segura 1; a logo bate quatro vezes, uma por batida; os takes finais duram 8, 6, 6 e 6
 * batidas; o ultimo fica, e a musica se apaga a partir da entrada dele (5,5 s).
 */
export const BATIDA_FACA = 52; // o ultimo take ("Apenas faca.") entra na batida 52
export const LINHA = [[0, ESTAGIOS.l3d], [6, ESTAGIOS.carga], ...CAPAS.map((_, i) => [10 + i, ESTAGIOS.capa + i]), [16, ESTAGIOS.trilha], [18, ESTAGIOS.registro], [19, ESTAGIOS.mascara], [22, ESTAGIOS.logo], [23, ESTAGIOS.logo + 1], [24, ESTAGIOS.logo + 2], [25, ESTAGIOS.logo + 3], [26, ESTAGIOS.manifesto], [34, ESTAGIOS.numeros], [40, ESTAGIOS.calendario], [46, ESTAGIOS.arsenal], [BATIDA_FACA, ESTAGIOS.faca]];
export const FIM_DA_MUSICA = { batida: BATIDA_FACA, duracao: 5500 }; // a musica comeca a se apagar quando o ultimo take entra e some em 5,5 s (1,5 s a menos que antes)
export const REPLAY_APOS = 2000; // o botao de replay surge 2 s depois de a musica parar

/** Os objetos 3D do app, na ordem em que o take do L 3D os passa, e o `preparar` deles (Palco.jsx baixa tudo no clique). */
export const OBJETOS_3D = ["letra-l", "raio", "engrenagem", "espada", "medalha", "relogio", "perfil", "cruz", "lithium"];
