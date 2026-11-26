import { CONTENT } from "../content/content.js";
import { DotField } from "../components/visuals/DotField.jsx";
import { Frame } from "../components/ui/Frame.jsx";
import { Thread } from "../components/ui/Thread.jsx";
import { BLOCK, ENVELOPE, OUTLINED, padTwoDigits } from "../app/ui.js";

const { title, shortVideos, news, open, videos, shorts, newsItem } = CONTENT.vibe;

const H3 =
  "m-0 text-bone font-secondary font-bold text-[22px] leading-[1.1] md:text-[24px] uppercase";

/** A imagem de um cartão, decorativa (alt vazio: a legenda ao lado já diz tudo), preenchendo a caixa do pai. */
const Cover = ({ src, position: pos }) => (
  <img
    src={src}
    alt=""
    width="1080"
    height="1080"
    loading="lazy"
    decoding="async"
    className={`absolute inset-0 size-full object-cover ${pos}`}
  />
);

/** O vídeo, no estilo "YouTube mobile" do app: capa 16:9, avatar do canal, título em duas linhas e "canal · data". */
function Clip({ title, source, src, position: pos, avatar }) {
  return (
    <li className="grid grid-cols-[40px_minmax(0,1fr)] gap-x-3 gap-y-1 content-start">
      <div className="relative col-span-full mb-2 aspect-video overflow-clip bg-surface-1 border border-line md:rounded-xl">
        <Cover src={src} position={pos} />
      </div>
      <img
        src={avatar}
        alt=""
        width="40"
        height="40"
        loading="lazy"
        decoding="async"
        className="row-span-2 size-10 rounded-full bg-line-strong object-cover"
      />
      <strong className="line-clamp-2 text-bone font-tertiary text-[16px] font-medium leading-[1.3]">
        {title}
      </strong>
      <span className="text-silver font-tertiary text-[12px]">{source}</span>
    </li>
  );
}

/** O curto: 9:16 com o título sobre um degrade no pé da capa, e o canal embaixo. */
function Short({ title, source, src, position: pos }) {
  return (
    <li className="flex-1 min-w-0 max-w-50 md:flex-none md:w-47.5 snap-start grid gap-2 content-start">
      <span className="relative flex flex-col justify-end aspect-[9/16] overflow-clip rounded-xl bg-surface-1 border border-line p-3">
        <Cover src={src} position={pos} />
        <span
          className="absolute inset-x-0 bottom-0 h-2/3 bg-linear-to-b from-transparent to-void/90"
          aria-hidden="true"
        />
        <strong className="relative line-clamp-4 text-white font-tertiary text-[14px] font-semibold leading-[1.25]">
          {title}
        </strong>
      </span>
      <span className="text-silver font-tertiary text-[12px]">{source}</span>
    </li>
  );
}

/** A notícia: cartão de 475 px, foto numa área própria (em cima no celular, à esquerda no monitor) e o texto ao lado. */
function News({ index, title, summary, source, src, position: pos }) {
  return (
    <li className="flex flex-col h-118.75 overflow-clip bg-surface-1 border border-line-strong md:flex-row">
      <span className="relative block flex-none h-47.5 overflow-clip bg-line md:h-auto md:w-[45%]">
        <Cover src={src} position={pos} />
      </span>
      <span className="flex flex-col flex-1 min-h-0 gap-3 p-5 md:p-6">
        <span className="font-tertiary font-bold text-[13px] leading-none tabular-nums text-silver">
          {padTwoDigits(index)}
        </span>
        <strong className="line-clamp-3 text-bone font-secondary font-bold uppercase text-[length:clamp(22px,5vw,29px)] leading-[1.1]">
          {title}
        </strong>
        <span className="line-clamp-4 text-silver font-tertiary text-[15px] leading-normal">
          {summary}
        </span>
        <span className="flex items-center justify-between gap-3 mt-auto pt-4 border-t border-line">
          <span className="text-silver font-tertiary text-[13px] uppercase">{source}</span>
          <span className="flex-none font-secondary text-label-large uppercase text-bone">
            {open} →
          </span>
        </span>
      </span>
    </li>
  );
}

/**
 * Social Vibe: o mural do app, na ordem dele (vídeos, Shorts e notícias de fisiculturismo), com a copy que explica o mural
 * nos títulos e legendas dos cartões. Sem estado e sem animação própria.
 * @returns {JSX.Element} A seção Social Vibe.
 */
export function SocialVibe() {
  return (
    <section
      id="social-vibe"
      className={`${BLOCK} isolate pb-16 md:pb-24`}
      aria-labelledby="social-vibe-titulo"
    >
      <DotField variant="estelar" />

      <div className="relative z-1 py-20 md:py-32">
        <Frame entrance="js" />
        <div className={`${ENVELOPE} flex flex-col items-start gap-3`}>
          <Thread />
          <h2
            id="social-vibe-titulo"
            className="flex flex-col w-full my-2 font-secondary font-extrabold uppercase tracking-[0.01em] leading-[1.04] text-bone text-[length:clamp(72px,20vw,200px)]"
            aria-label={title.join(" ")}
          >
            {title.map((line, i) => (
              <span key={line} className={`block ${i === 0 ? OUTLINED : ""}`} aria-hidden="true">
                {line}
              </span>
            ))}
          </h2>
          <Thread />
        </div>
      </div>

      <div className={`${ENVELOPE} relative z-1 grid gap-10 pt-7 md:gap-12`}>
        <ol className="grid gap-x-6 gap-y-8 list-none p-0 m-0 md:grid-cols-2">
          {videos.map((video) => (
            <Clip key={video.title} {...video} />
          ))}
        </ol>

        <section className="grid gap-4">
          <h3 className={`${H3} flex items-center gap-2 normal-case`}>
            <svg
              viewBox="0 0 24 24"
              width="22"
              height="22"
              className="text-accent"
              aria-hidden="true"
            >
              <path
                d="M10 14.65v-5.3L15 12l-5 2.65zm7.77-4.33-1.2-.5L18 9.06a3.74 3.74 0 0 0-1.43-5.17 3.7 3.7 0 0 0-1.76-.42 3.7 3.7 0 0 0-1.72.43L6 8.17a3.74 3.74 0 0 0 .26 6.72l1.2.5L6 15.64a3.74 3.74 0 0 0 1.43 5.17 3.7 3.7 0 0 0 3.5.1L18 17.83a3.74 3.74 0 0 0-.23-7.51z"
                fill="currentColor"
              />
            </svg>
            {shortVideos}
          </h3>
          <ol className="flex gap-3 overflow-x-auto list-none p-0 m-0 snap-x snap-mandatory [scrollbar-width:none]">
            {shorts.map((short) => (
              <Short key={short.title} {...short} />
            ))}
          </ol>
        </section>

        <section className="grid gap-6">
          <h3 className={H3}>{news}</h3>
          <ol className="flex flex-col gap-4 list-none p-0 m-0">
            <News index={1} {...newsItem} />
          </ol>
        </section>
      </div>
    </section>
  );
}
