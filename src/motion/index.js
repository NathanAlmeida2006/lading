import { useEffect } from "react";
import { carregarCoreografias, abrirLeitura } from "./carregador.js";
import { aoMudarPreferencia, semMovimento } from "./tokens.js";
import { estaPausado } from "./pausa.js";
export { ligarLenis } from "./rolagem.js";

let escopoAtual = null;

/** Efeitos são opcionais: exceção ou import rejeitado nunca derruba a raiz. */
export function useMovimento(efeito, deps = []) {
  useEffect(() => {
    if (!document.documentElement.classList.contains("js")) return;
    let escopo;
    let montado = true;
    const limparEscopo = () => {
      if (!escopo?.ativo) return;
      escopo.ativo = false;
      for (const limpar of escopo.limpar) {
        try { limpar(); } catch (erro) { console.error(erro); }
      }
      escopo.limpar.clear();
    };
    const executar = () => {
      limparEscopo();
      if (!montado || !document.documentElement.classList.contains("js") ||
          document.documentElement.classList.contains("movimento-falhou")) return;
      escopo = { ativo: true, limpar: new Set() };
      const anterior = escopoAtual;
      escopoAtual = escopo;
      try {
        const limpar = efeito();
        if (typeof limpar === "function") escopo.limpar.add(limpar);
      } catch (erro) {
        console.error(erro);
        limparEscopo();
        abrirLeitura();
      } finally {
        escopoAtual = anterior;
      }
    };
    executar();
    const soltarPreferencia = aoMudarPreferencia(executar);
    return () => { montado = false; soltarPreferencia(); limparEscopo(); };
  }, deps);
}

function chamar(nome, args, comSinal = false) {
  const escopo = escopoAtual;
  const controlador = new AbortController();
  let ativo = true;
  let resultado;
  const cancelar = () => {
    if (!ativo) return;
    ativo = false;
    controlador.abort();
    try { resultado?.revert?.(); } catch (erro) { console.error(erro); }
    if (typeof resultado === "function") {
      try { resultado(); } catch (erro) { console.error(erro); }
    }
  };
  cancelar.revert = cancelar;
  escopo?.limpar.add(cancelar);
  // Um clique no CTA também pode iniciar a carga. Ele segue seu href normal.
  carregarCoreografias().then((modulo) => {
    if (!ativo || (escopo && !escopo.ativo) || document.documentElement.classList.contains("movimento-falhou")) return;
    document.documentElement.classList.add("movimento-pronto");
    try {
      resultado = modulo[nome](...args, ...(comSinal ? [controlador.signal] : []));
      if (resultado && typeof resultado.then === "function") {
        resultado.then((limpar) => {
          resultado = limpar;
          if (!ativo) {
            try {
              if (typeof limpar === "function") limpar();
              else limpar?.revert?.();
            } catch (erro) { console.error(erro); }
          }
        }).catch((erro) => {
          if (!ativo) return;
          console.error(erro);
          abrirLeitura();
        });
      }
    } catch (erro) {
      console.error(erro);
      abrirLeitura();
    }
  }).catch(() => { if (ativo) abrirLeitura(); }); // o erro da carga e registrado uma vez, em carregador.js
  return cancelar;
}

export const revelar = (...args) => chamar("revelar", args);
export const revelarEmCascata = (...args) => chamar("revelarEmCascata", args);
export const mascaraDeLinha = (alvo, opcoes = {}) => chamar("mascaraDeLinha", [alvo, opcoes], true);
export const subirLinhas = (...args) => chamar("subirLinhas", args);
export const acenderEmSequencia = (...args) => chamar("acenderEmSequencia", args);
export const pulsar = (alvo) => (semMovimento() || estaPausado() ? undefined : chamar("pulsar", [alvo]));
export const abrirPainel = (...args) => chamar("abrirPainel", args);

/** Rede de segurança nativa; independe do chunk de animação. */
export function garantirVisibilidade() {
  let timer;
  const varrer = () => {
    for (const el of document.querySelectorAll("[data-revelar]")) {
      const caixa = el.getBoundingClientRect();
      if (caixa.top >= innerHeight || caixa.bottom <= 0) continue;
      if (parseFloat(getComputedStyle(el).opacity) < 0.99) {
        el.style.opacity = "1";
        el.style.transform = "none";
      }
      for (const linha of el.querySelectorAll("[data-line], .linha__texto")) {
        if (getComputedStyle(linha).transform !== "none") linha.style.transform = "none";
      }
    }
    for (const palavra of document.querySelectorAll(".palavra:not([data-acesa])")) {
      if (palavra.getBoundingClientRect().bottom < 0) palavra.setAttribute("data-acesa", "");
    }
  };
  const aoRolar = () => {
    if (timer) return;
    timer = setTimeout(() => { timer = 0; varrer(); }, 2500);
  };
  aoRolar();
  window.addEventListener("scroll", aoRolar, { passive: true });
  return () => { clearTimeout(timer); window.removeEventListener("scroll", aoRolar); };
}
