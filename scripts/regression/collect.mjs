// Módulo de funções (PROPS, PSEUDO, coletarNaPagina, coletar) usado pelo harness de regressão.
// Não executa nada sozinho e não escreve arquivos. Não importa playwright-core: recebe a página por parâmetro.
export const PROPS =
  "display position top right bottom left z-index float flex-direction flex-wrap flex-grow flex-shrink flex-basis align-items align-self align-content justify-content justify-self justify-items order row-gap column-gap grid-template-columns grid-template-rows grid-column-start grid-column-end grid-row-start grid-row-end grid-auto-flow width height min-width min-height max-width max-height aspect-ratio box-sizing margin-top margin-right margin-bottom margin-left padding-top padding-right padding-bottom padding-left border-top-width border-right-width border-bottom-width border-left-width border-top-style border-right-style border-bottom-style border-left-style border-top-color border-right-color border-bottom-color border-left-color border-top-left-radius outline-style outline-width outline-color outline-offset overflow-x overflow-y clip-path isolation mix-blend-mode opacity visibility color background-color background-image background-size background-repeat background-position-x background-position-y background-clip font-family font-size font-weight font-style font-variant-numeric line-height letter-spacing word-spacing text-transform text-align text-indent text-decoration-line text-decoration-style text-decoration-color text-decoration-thickness text-underline-offset text-overflow white-space word-break overflow-wrap vertical-align -webkit-text-stroke-width -webkit-text-stroke-color -webkit-text-fill-color list-style-type cursor pointer-events user-select touch-action transform-origin transition-property transition-duration transition-timing-function transition-delay animation-name animation-duration animation-timing-function animation-delay animation-iteration-count animation-direction animation-fill-mode fill stroke stroke-width object-fit box-shadow text-shadow filter will-change mask-image".split(
    " ",
  );
export const PSEUDO =
  "content display position top right bottom left width height z-index background-color background-image background-size opacity mix-blend-mode pointer-events color animation-name transition-property".split(
    " ",
  );
export function coletarNaPagina({ props, pseudo, raiz }) {
  const ig = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE"]);
  const base = raiz ? document.querySelector(raiz) : document.body;
  const els = [...base.querySelectorAll("*")].filter(
    (e) => !ig.has(e.tagName) && !e.closest("svg *"),
  );
  return els.map((el) => {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    const e = {};
    for (const p of props) e[p] = cs.getPropertyValue(p);
    const tf = ["transform", "translate", "rotate", "scale"]
      .map((p) => cs.getPropertyValue(p))
      .join(" | ");
    const ps = {};
    for (const q of ["::before", "::after"]) {
      const pc = getComputedStyle(el, q);
      const c = pc.getPropertyValue("content");
      if (c && c !== "none" && c !== "normal") {
        const o = {};
        for (const p of pseudo) o[p] = pc.getPropertyValue(p);
        ps[q] = o;
      }
    }
    const txt = [...el.childNodes]
      .filter((n) => n.nodeType === 3)
      .map((n) => n.textContent)
      .join("")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 60);
    return {
      tag: el.tagName.toLowerCase(),
      cls: typeof el.className === "string" ? el.className.split(/\s+/).slice(0, 3).join(".") : "",
      txt,
      x: +(r.left + scrollX).toFixed(2),
      y: +(r.top + scrollY).toFixed(2),
      w: +r.width.toFixed(2),
      h: +r.height.toFixed(2),
      tf,
      e,
      ps,
    };
  });
}
export const coletar = async (p, raiz) => {
  const arg = { props: PROPS, pseudo: PSEUDO, raiz };
  const a = await p.evaluate(coletarNaPagina, arg);
  await p.waitForTimeout(350);
  const b = await p.evaluate(coletarNaPagina, arg);
  a.forEach((r, i) => {
    const q = b[i];
    r.v =
      !q ||
      r.x !== q.x ||
      r.y !== q.y ||
      r.w !== q.w ||
      r.h !== q.h ||
      r.tf !== q.tf ||
      r.e.opacity !== q.e.opacity ||
      r.txt !== q.txt;
  });
  const doc = await p.evaluate(() => ({
    sw: document.documentElement.scrollWidth,
    sh: document.documentElement.scrollHeight,
  }));
  return { doc, els: a };
};
