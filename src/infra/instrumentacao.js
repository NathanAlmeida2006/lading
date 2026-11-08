/**
 * Instrumentacao: parametros, consentimento, pixel e alcance das secoes.
 *
 * Regra que organiza o arquivo inteiro (RF-L29): a landing reporta INTENCAO,
 * a Hotmart reporta o FATO. `Purchase` nao nasce aqui. Pixel que dispara compra
 * no clique conta venda que pode nao ter acontecido, e o ledger passa a
 * registrar receita que o extrato desmente.
 *
 * O estado de mensuracao mora nas fabricas, instanciadas uma vez aqui, e nao em
 * componente: sobrevive ao StrictMode e a remontagem, e a pagina tem um dono so
 * para "ja enviei isto?".
 */
import { criarParametros } from "./parametros.js";
import { criarConsentimento } from "./consentimento.js";
import { criarPixel } from "./pixel.js";
import { criarAlcance } from "./alcance.js";

export { capturarParametros, urlCheckout } from "./parametros.js";

const parametros = criarParametros();
const consentimento = criarConsentimento();
const pixel = criarPixel(consentimento.lerConsentimento);
const alcance = criarAlcance({ assinarConsentimento: consentimento.assinarConsentimento, pixel });

export const useParametros = parametros.useParametros;
export const lerConsentimento = consentimento.lerConsentimento;
export const assinarConsentimento = consentimento.assinarConsentimento;
export const useConsentimento = consentimento.useConsentimento;
export const responderConsentimento = consentimento.responderConsentimento;
export const registrarInicioCheckout = pixel.registrarInicioCheckout;
export const iniciarMensuracao = alcance.iniciarMensuracao;
