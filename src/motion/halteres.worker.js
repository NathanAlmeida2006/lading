// Assa a pilha fora da main thread: recebe [largura, altura, versao, semente, preset], devolve
// { versao, sim }.
import { assar } from "./halteres.js";

self.onmessage = ({ data: [largura, altura, versao, semente, preset] }) => {
  const sim = assar(largura, altura, semente, preset);
  self.postMessage({ versao, sim }, [sim.poses.buffer]);
};
