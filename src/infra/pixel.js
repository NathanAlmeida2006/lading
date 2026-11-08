import { config } from "./config.js";

/* -------------------------------------------------------------------------
   Pixel
   ------------------------------------------------------------------------- */

// Tudo o que a pagina sabe enviar (RF-L28). Nome fora desta lista nao sai: `Purchase` nao tem como nascer aqui.
const EVENTOS = {
  PageView: "track",
  ViewContent: "track",
  InitiateCheckout: "track",
  SecaoAlcancada: "trackCustom",
};

const idDoPixel = () => String(config.pixel.id ?? "").trim();

export function criarPixel(lerConsentimento) {
  let pixelInjetado = false; // o script que ESTE modulo pos na pagina; `window.fbq` alheio nao conta
  let pixelFalhou = false; // o script nao carregou (bloqueado): o stub enfileiraria para sempre, sem enviar
  let paginaVista = false;

  /**
   * A guarda unica (RNF-L23). Carregar o pixel exige aceite e id; enviar exige, alem disso, o
   * script injetado por este modulo. Nada de terceiro acontece fora dela.
   */
  function elegivel(paraEnvio = true) {
    if (lerConsentimento() !== true || !idDoPixel()) return false;
    return !paraEnvio || (pixelInjetado && !pixelFalhou && typeof window.fbq === "function");
  }

  /** Idempotente: um script, um `init` e um PageView por carga de pagina. */
  function carregarPixel() {
    if (!elegivel(false)) return;
    if (!pixelInjetado) {
      if (window.fbq) return; // pixel de outra origem: este modulo nao assume o que nao carregou
      try {
        const fbq = function () {
          fbq.callMethod ? fbq.callMethod.apply(fbq, arguments) : fbq.queue.push(arguments);
        };
        fbq.push = fbq; fbq.loaded = true; fbq.version = "2.0"; fbq.queue = [];
        window.fbq = fbq;
        window._fbq ??= fbq;
        const script = document.createElement("script");
        script.async = true;
        script.src = "https://connect.facebook.net/en_US/fbevents.js";
        script.onerror = () => { pixelFalhou = true; };
        document.head.appendChild(script);
        pixelInjetado = true;
        fbq("init", idDoPixel());
      } catch {
        return;
      }
    }
    if (!paginaVista) paginaVista = evento("PageView");
  }

  /** Devolve se o evento saiu. Erro do tracker morre aqui: nunca chega a quem chamou. */
  function evento(nome, dados) {
    try {
      if (!EVENTOS[nome] || !elegivel()) return false;
      if (dados) window.fbq(EVENTOS[nome], nome, dados);
      else window.fbq(EVENTOS[nome], nome);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Intencao de compra no clique de um CTA: cada clique legitimo e um evento, sem deduplicar.
   * Sincrono e sem retorno: o clique nao espera nada daqui. Com checkout nao confirmado (o link
   * ainda e a ancora do preview) nao ha intencao a registrar.
   */
  function registrarInicioCheckout(posicaoCTA) {
    if (config.checkout.urlConfirmada !== true) return;
    evento("InitiateCheckout", { posicaoCTA, campanha: config.campanha });
  }

  return { elegivel, carregarPixel, evento, registrarInicioCheckout };
}
