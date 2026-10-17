import { useEffect } from "react";
import { aoMudarPreferencia, curva, semMovimento } from "./tokens.js";

/**
 * A regua do mapa (Semanas.jsx): quantos passos ja foram lidos, medido no trilho de cards que
 * permanece no fluxo (a regua sticky apenas exibe), e o "engolir" quando ela chega ao fim.
 * A secao so fornece o DOM, o numero de passos e a frase.
 */

function topoEmFluxo(elemento) {
  let topo = 0;
  for (let no = elemento; no; no = no.offsetParent) topo += no.offsetTop;
  return topo;
}

/**
 * Os marcos de leitura de cada card, relativos ao trilho. So mudam quando o layout do trilho muda,
 * entao saem do quadro de rolagem: sao medidos uma vez e refeitos a cada mudanca de tamanho.
 */
function medirMarcos(trilho) {
  const origem = topoEmFluxo(trilho);
  const marcos = Array.from(trilho.children, (card) => ({
    topo: topoEmFluxo(card) - origem,
    semana: Number(card.dataset.semana),
  }));
  // Se a grade alinhar cards, o grupo ocupa o seu trecho natural de leitura.
  // A ordem editorial permanece explícita, sem transformar colunas em novas etapas.
  for (let inicio = 0; inicio < marcos.length;) {
    let fim = inicio + 1;
    while (fim < marcos.length && marcos[fim].topo === marcos[inicio].topo) fim += 1;
    const topo = marcos[inicio].topo;
    const limite = marcos[fim]?.topo ?? trilho.offsetHeight;
    for (let indice = inicio + 1; indice < fim; indice += 1) {
      marcos[indice].topo = topo + (limite - topo) * (indice - inicio) / (fim - inicio);
    }
    inicio = fim;
  }
  return { marcos, alto: trilho.offsetHeight };
}

function passoNoTrilho(posicao, marcos, passos) {
  if (posicao < marcos[0].topo) return 0;
  for (let indice = 0; indice < marcos.length - 1; indice += 1) {
    const inicio = marcos[indice];
    const fim = marcos[indice + 1];
    if (posicao >= fim.topo) continue;
    const proporcao = (posicao - inicio.topo) / (fim.topo - inicio.topo);
    return Math.floor(inicio.semana + proporcao * (fim.semana - inicio.semana));
  }
  return passos;
}

/**
 * Chegou ao ultimo passo: o retangulo vermelho dele cresce ate engolir a propria regua (so ela),
 * o texto sobe em tinta no meio e, passada a leitura, a cortina se ergue e devolve os numeros.
 * E imagem, nao interface: a regua ja e `aria-hidden`. Devolve a limpeza (cancela e remove, se a
 * secao sair antes do fim).
 */
const EXPO_IN_OUT = "cubic-bezier(0.76, 0, 0.24, 1)";

function engolirRegua(semana, frase) {
  const regua = semana.parentElement;
  const o = regua.getBoundingClientRect();
  const r = semana.getBoundingClientRect();
  // A origem e a marca de 6px do ultimo passo, em coordenadas da propria regua.
  const esq = r.left - o.left;
  const dir = o.right - r.right;
  const topo = r.top - o.top;
  const base = o.height - topo - 6;
  const cobertura = document.createElement("div");
  cobertura.className = "absolute inset-0 z-1 flex items-center justify-center bg-acento text-void pointer-events-none overflow-clip";
  cobertura.setAttribute("aria-hidden", "true");
  const texto = document.createElement("p");
  // O corpo da frase cabe na regua: pela altura dela e, no celular, pela largura.
  const corpo = Math.min(o.height * 0.5, o.width / (frase.length * 0.62));
  texto.className = "flex justify-center gap-[0.3em] font-secundaria font-extrabold uppercase leading-none tracking-[0.02em] whitespace-nowrap";
  texto.style.fontSize = `${corpo}px`;
  const letras = [];
  for (const palavra of frase.split(" ")) {
    const bloco = document.createElement("span");
    bloco.className = "inline-flex overflow-clip pb-[0.2em] -mb-[0.2em]";
    for (const letra of palavra) {
      const el = document.createElement("span");
      el.className = "inline-block";
      el.textContent = letra;
      bloco.append(el);
      letras.push(el);
    }
    texto.append(bloco);
  }
  cobertura.append(texto);
  regua.append(cobertura);

  const fill = "both";
  const entra = cobertura.animate(
    [{ clipPath: `inset(${topo}px ${dir}px ${base}px ${esq}px)` }, { clipPath: "inset(0px 0px 0px 0px)" }],
    { duration: 800, easing: EXPO_IN_OUT, fill },
  );
  const anims = [entra];
  const expo = curva("--ease-expo");
  letras.forEach((el, i) => {
    anims.push(el.animate(
      [{ transform: "translateY(120%)" }, { transform: "translateY(0)" }],
      { duration: 650, delay: 550 + i * 40, easing: expo, fill },
    ));
  });
  const sai = 550 + letras.length * 40 + 650 + 1100; // a ultima letra assenta e a frase fica lida
  const fim = cobertura.animate(
    [{ clipPath: "inset(0px 0px 0px 0px)" }, { clipPath: "inset(0px 0px 100% 0px)" }],
    { duration: 700, delay: sai, easing: EXPO_IN_OUT, fill: "forwards" },
  );
  anims.push(fim);
  fim.onfinish = () => cobertura.remove();
  return () => { anims.forEach((a) => a.cancel()); cobertura.remove(); };
}

/** Estado local de leitura, medido no trilho que permanece no fluxo. */
export function useReguaDoTrilho(raiz, trilho, passos, frase) {
  useEffect(() => {
    const no = trilho.current;
    if (!no) return;
    const semanas = Array.from(raiz.current?.querySelectorAll(".regua12__semana") ?? []);
    const documento = document.documentElement;
    const viewport = window.visualViewport;
    let ativo = true;
    let quadro = 0;
    let ultimo = null;
    // Medidos fora do quadro de rolagem: so a rolagem le do cache; o resto o invalida.
    let medidos = null;
    // Passo lido na medicao anterior; o engolir so dispara ao CHEGAR ao fim rolando, nunca ao
    // carregar a pagina ja depois dele, e so uma vez por visita.
    let anterior = null;
    let limparEngolir = null;
    const escrever = (acesas, atual) => {
      const estado = `${acesas}:${atual}`;
      if (estado === ultimo) return;
      ultimo = estado;
      for (const [indice, semana] of semanas.entries()) {
        semana.toggleAttribute("data-acesa", indice < acesas);
        semana.toggleAttribute("data-atual", indice === atual);
      }
    };
    const atualizar = () => {
      quadro = 0;
      if (!ativo) return;
      const leituraCompleta = semMovimento() || documento.hasAttribute("data-pausado") ||
        !documento.classList.contains("movimento-pronto") ||
        documento.classList.contains("movimento-falhou");
      const caixa = no.getBoundingClientRect();
      if (leituraCompleta || caixa.height <= 0) {
        escrever(semanas.length, -1);
        anterior = passos;
        return;
      }
      const altura = Math.min(window.innerHeight, viewport?.height ?? window.innerHeight);
      const linhaDeLeitura = (viewport?.offsetTop ?? 0) + altura / 2;
      medidos ??= medirMarcos(no);
      const { marcos, alto } = medidos;
      // O caminho está lido quando o fim do último card entra na tela, antes do CTA.
      const final = { topo: Math.max(marcos.at(-1).topo, alto - altura / 2), semana: passos };
      // A posição acompanha a leitura dos cards, um passo por card.
      const acesas = passoNoTrilho(linhaDeLeitura - caixa.top, [...marcos, final], passos);
      escrever(acesas, acesas - 1);
      if (anterior !== null && anterior < passos && acesas >= passos && !limparEngolir) {
        limparEngolir = engolirRegua(semanas.at(-1), frase);
      }
      anterior = acesas;
    };
    const agendar = () => {
      if (ativo && !quadro) quadro = requestAnimationFrame(atualizar);
    };
    const remedir = () => {
      medidos = null;
      agendar();
    };
    const tamanho = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(remedir);
    tamanho?.observe(no);
    for (const card of no.children) tamanho?.observe(card);
    const movimento = typeof MutationObserver === "undefined" ? null : new MutationObserver(remedir);
    movimento?.observe(documento, { attributes: true, attributeFilter: ["class", "data-pausado"] });
    window.addEventListener("scroll", agendar, { passive: true });
    window.addEventListener("resize", remedir);
    window.addEventListener("orientationchange", remedir);
    window.addEventListener("pageshow", remedir);
    viewport?.addEventListener("resize", remedir);
    viewport?.addEventListener("scroll", agendar, { passive: true });
    const soltarPreferencia = aoMudarPreferencia(remedir);
    document.fonts?.ready.then(remedir);
    atualizar();
    return () => {
      ativo = false;
      cancelAnimationFrame(quadro);
      tamanho?.disconnect();
      movimento?.disconnect();
      window.removeEventListener("scroll", agendar);
      window.removeEventListener("resize", remedir);
      window.removeEventListener("orientationchange", remedir);
      window.removeEventListener("pageshow", remedir);
      viewport?.removeEventListener("resize", remedir);
      viewport?.removeEventListener("scroll", agendar);
      soltarPreferencia();
      limparEngolir?.();
      escrever(semanas.length, -1);
    };
  }, [raiz, trilho, passos, frase]);
}
