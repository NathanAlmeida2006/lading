/**
 * Le as duracoes e curvas do CSS, em vez de repeti-las aqui.
 *
 * RNF-L17 nao admite valor solto: os tokens de movimento vivem em
 * `tokens/movimento.css`, que e traducao do mestre visual §10. Duplicar
 * "180ms" neste arquivo criaria a segunda fonte da verdade que o RNF-G16
 * proibe, e ela envelheceria em silencio.
 */
const PADROES = {
  "--motion-fast": 120,
  "--motion-slow": 280,
};

let cache = null;

export function duracao(nome) {
  if (typeof window === "undefined") return PADROES[nome];
  if (!cache) {
    cache = {};
    const estilo = getComputedStyle(document.documentElement);
    for (const chave of Object.keys(PADROES)) {
      const bruto = estilo.getPropertyValue(chave).trim();
      const ms = bruto.endsWith("ms")
        ? parseFloat(bruto)
        : bruto.endsWith("s")
          ? parseFloat(bruto) * 1000
          : NaN;
      cache[chave] = Number.isFinite(ms) ? ms : PADROES[chave];
    }
  }
  return cache[nome];
}

// Uma curva do CSS (o `--ease-expo` das revelacoes), para o WAAPI usar a mesma do resto da pagina.
const CURVAS = { "--ease-expo": "cubic-bezier(0.16, 1, 0.3, 1)" };

export function curva(nome) {
  if (typeof window === "undefined") return CURVAS[nome];
  return getComputedStyle(document.documentElement).getPropertyValue(nome).trim() || CURVAS[nome];
}

// Uma consulta so para a pagina inteira: `.matches` e vivo, e ha quem leia a cada quadro de rolagem.
let consulta = null;
const preferencia = () => (consulta ??= window.matchMedia("(prefers-reduced-motion: reduce)"));

/**
 * Movimento nunca comunica sozinho (mestre §10). Com a preferencia ligada,
 * tudo vira opacidade: sem deslocamento, sem corte, sem desenho.
 */
export function semMovimento() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return preferencia().matches;
}

/** Reexecuta efeitos quando a preferência muda sem deixar um listener órfão. */
export function aoMudarPreferencia(ouvinte) {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const media = preferencia();
  media.addEventListener?.("change", ouvinte);
  return () => media.removeEventListener?.("change", ouvinte);
}
