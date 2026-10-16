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
    const limparEscopo = (alvo = escopo) => {
      if (!alvo?.ativo) return;
      alvo.ativo = false;
      for (const limpar of alvo.limpar) {
        try { limpar(); } catch (erro) { console.error(erro); }
      }
      alvo.limpar.clear();
    };
    const executar = () => {
      limparEscopo();
      if (!montado || !document.documentElement.classList.contains("js") ||
          document.documentElement.classList.contains("movimento-falhou")) return;
      escopo = { ativo: true, limpar: new Set() };
      const anterior = escopoAtual;
      escopoAtual = escopo;
      try {
        const resultado = efeito();
        const desteEfeito = escopo;
        Promise.resolve(resultado).then((limpar) => {
          if (typeof limpar !== "function") return;
          if (desteEfeito.ativo) desteEfeito.limpar.add(limpar);
          else {
            try { limpar(); } catch (erro) { console.error(erro); }
          }
        }).catch((erro) => {
          if (!desteEfeito.ativo) return;
          console.error(erro);
          limparEscopo(desteEfeito);
          abrirLeitura();
        });
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

function chamar(nome, args) {
  if (typeof document === "undefined") return { revert() {} };
  if (nome === "pulsar" && (semMovimento() || estaPausado())) return { revert() {} };
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
      resultado = modulo[nome](...args, controlador.signal);
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
export const mascaraDeLinha = (alvo, opcoes = {}) => chamar("mascaraDeLinha", [alvo, opcoes]);
export const subirLinhas = (...args) => chamar("subirLinhas", args);
export const desenhar = (...args) => chamar("desenhar", args);
export const acenderEmSequencia = (...args) => chamar("acenderEmSequencia", args);
export const pulsar = (...args) => chamar("pulsar", args);
export const abrirPainel = (...args) => chamar("abrirPainel", args);

/** Rede de segurança nativa; independe do chunk de animação. */
export function garantirVisibilidade() {
  if (typeof window === "undefined") return () => {};
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
