/**
 * O relogio do video: a musica (public/apex.mp3, a partir dos 21 s do arquivo; `apex-video.mp3` e esse trecho, mais leve) tem
 * 119 BPM e o "drop", a primeira batida forte, em 24,23 s do arquivo, ou seja, 3,23 s depois de ela comecar. Todo corte do video cai
 * numa batida: `batida(n)` e o instante, em ms depois do clique, da batida `n` contada a partir do drop.
 *
 * Para refazer o trecho com outro inicio: ffmpeg -ss <inicio> -t 75 -i public/apex.mp3 -vn -c:a libmp3lame -b:a 160k public/apex-video.mp3
 * e ajuste `DROP` (o drop, em s, menos o inicio) e `BATIDA`.
 */
export const BATIDA = 504.2; // ms entre batidas (119 BPM)
export const DROP = 3230; // ms depois do clique em que cai o drop
export const batida = (n) => DROP + n * BATIDA;
export const MUSICA = "/apex-video.mp3";
export const EFEITO_FINAL = "/rdr.mp3"; // o efeito sonoro que abre o ultimo take
