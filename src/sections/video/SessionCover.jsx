import { Thread } from "../../components/ui/Thread.jsx";
import { Model3D } from "./Model3D.jsx";
import { Frame } from "../../components/ui/Frame.jsx";
import { Label } from "../../components/ui/Label.jsx";
import { HIGHLIGHT, OUTLINED } from "../../app/ui.js";

/**
 * O tamanho do titulo, como o `.sessao-capa .hoje-display` do app: o da Home (27vw, ate 240 px), encolhido o bastante para a palavra
 * mais longa caber na linha (a .5em por letra) e para as linhas que aparecem na tela (a 1,04 de altura de linha) caberem na altura,
 * com o botao e os numeros (o app tem a tela de um celular; aqui ha desktop baixo). Uma linha mais larga que a palavra mais longa
 * quebra nas palavras, como no app.
 * @param {string[]} lines - Linhas do título.
 * @returns {string} Valor CSS de font-size.
 */
function getTitleSize(lines) {
  const letters = Math.max(...lines.join(" ").split(" ").map((part) => part.length));
  const onScreen = lines.reduce((total, line) => total + (line.length > letters ? line.split(" ").length : 1), 0);
  return `min(clamp(72px, 27vw, 240px), calc((min(100vw, 1080px) - 2 * var(--respiro)) / ${letters * 0.5}), calc((100svh - 340px) / ${(onScreen * 1.04).toFixed(2)}))`;
}

/**
 * A capa de uma sessao do app Lithium (Sessao.jsx + PainelCartaz.jsx, em app-lithium), como ela abre na tela: cantos, grao, malha
 * de pontos (o grao e o fundo sao os do Stage.jsx, compartilhados entre as capas), o kicker, os dois fios, o titulo em escala de cartaz (a primeira linha so em contorno, se ha mais de uma), o objeto 3D
 * flutuando atras do titulo e, nas sessoes (`hasAction`), o botao e os numeros crus. O mesmo painel abre as abas da EU (Semana,
 * Corpo, Social Vibe), sem botao nem numeros e sem os menus do app. O acento e o do protocolo (`accent`, o `--acento` desta capa).
 *
 * Ela e estatica, da primeira a ultima, e entra sempre em corte seco: nada se move, nada cresce, nada conta, nada se desenha (so o
 * kicker, o titulo e os numeros mudam de uma capa para a outra, de uma vez), e o que muda de verdade e o objeto 3D, que flutua livre
 * (`origin`: de onde o giro conta, para o mesmo giro seguir de uma capa para a outra).
 * @param {object} props
 * @param {string} props.kicker - Rótulo acima do título.
 * @param {string[]} props.lines - Linhas do título.
 * @param {string} props.model - Nome do objeto 3D da capa.
 * @param {string} props.accent - Cor de acento da capa (valor CSS).
 * @param {string} props.color - Cor do traço do objeto 3D.
 * @param {string} props.onAccent - Cor do texto sobre o acento.
 * @param {number} props.readings - Número de leituras da sessão.
 * @param {boolean} [props.hasAction=true] - Mostra o botão e os números.
 * @param {number} [props.origin] - Hora de onde o giro do objeto 3D conta.
 * @returns {JSX.Element} A capa da sessão, em corte seco.
 */
export function SessionCover({ kicker, lines, model, accent, color, onAccent, readings, hasAction = true, origin }) {
  return (
    <section
      className="absolute inset-0 z-4 overflow-clip text-bone [--respiro:24px] md:[--respiro:48px]"
      style={{ "--acento": accent }}
      aria-hidden="true"
    >
      <div className="absolute inset-0 flex flex-col pt-8 pb-6">
      <Frame entrance="js" />
      <Model3D model={model} color={color} origin={origin} className="absolute inset-0 z-1 pointer-events-none" />

      <div className={`relative z-2 flex-1 flex flex-col justify-center items-start gap-3 w-full max-w-[1080px] mx-auto px-(--respiro) py-4 ${hasAction ? "" : "pb-24"}`}>
        <Label margin="mb-0">{kicker}</Label>
        <Thread />
        <h1
          className="flex flex-col w-full my-2 font-secundaria font-extrabold uppercase tracking-[0.01em] leading-[1.04] text-bone"
          style={{ fontSize: getTitleSize(lines) }}
        >
          {lines.map((text, i) => (
            <span className={`block ${i === 0 && lines.length > 1 ? OUTLINED : ""}`} key={text}>{text}</span>
          ))}
        </h1>
        <Thread />
      </div>

      {hasAction && (
        <div className="relative z-2 flex flex-col items-center gap-4 px-(--respiro) pt-6 text-center">
          <span
            className="inline-flex items-center justify-center gap-3 w-full max-w-105 min-h-15 px-6 py-3 bg-acento border border-acento rounded-xs font-secundaria text-[18px] font-bold uppercase tracking-[0.04em]"
            style={{ color: onAccent }}
          >
            Começar a leitura
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M19 12l-7 7-7-7" /></svg>
          </span>
          <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-silver font-terciaria text-caption" role="list">
            <li><b className={HIGHLIGHT}>{readings}</b> leituras</li>
            <li><b className={HIGHLIGHT}>10</b> sessões</li>
          </ul>
        </div>
      )}
      </div>
    </section>
  );
}
