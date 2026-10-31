import { CampoDePontos } from "../../components/CampoDePontos.jsx";
import { AppRegistro } from "./AppRegistro.jsx";
import { AppTrilha } from "./AppTrilha.jsx";
import { CapaDaSessao } from "./CapaDaSessao.jsx";
import { LogoLithium } from "./LogoLithium.jsx";
import { preparar } from "./Modelo3D.jsx";
import { TakeArsenal, TakeCalendario, TakeCarga, TakeFaca, TakeL3D, TakeManifesto, TakeNumeros } from "./Takes.jsx";
import { BATIDA, CAPAS, ESTAGIOS, FIM_DA_MUSICA, OBJETOS_3D, REPLAY_APOS } from "./tempo.js";

/** Baixa e le os modelos antes do primeiro corte que os usa. */
export function prepararModelos() {
  [...CAPAS.map(({ modelo }) => modelo), ...OBJETOS_3D].forEach((modelo) => preparar(modelo).catch(() => {}));
}

/** O que entra sobre o vermelho depois do clique: um chunk tardio, para nao pesar em quem nunca toca o video. */
export default function Palco({ estagio, agenda, origem, velocidade, aoRepetir }) {
  return (
    <>
      {estagio === ESTAGIOS.l3d && <TakeL3D inicioEm={agenda.current[ESTAGIOS.l3d]} />}
      {/* Um unico fundo (preto + malha de pontos) para a carga e as seis capas: ele nao remonta nos cortes, so a frente troca.
          Remontar o canvas a cada corte dava um piscar de um quadro e reiniciava a onda. As frentes abaixo sao transparentes. */}
      {estagio >= ESTAGIOS.carga && estagio < ESTAGIOS.trilha && (
        <div className="absolute inset-0 z-4 bg-void" aria-hidden="true">
          <CampoDePontos />
        </div>
      )}
      {estagio === ESTAGIOS.carga && <TakeCarga />}
      {estagio >= ESTAGIOS.capa && estagio < ESTAGIOS.trilha && <CapaDaSessao {...CAPAS[estagio - ESTAGIOS.capa]} origem={origem.current} />}
      {estagio === ESTAGIOS.trilha && <AppTrilha duracao={2 * BATIDA} inicioEm={agenda.current[ESTAGIOS.trilha]} aoMedir={(v) => { velocidade.current = v; }} />}
      {estagio >= ESTAGIOS.mascara && estagio < ESTAGIOS.manifesto && <div className="absolute inset-0 z-4 bg-void" aria-hidden="true" />}
      {estagio >= ESTAGIOS.registro && estagio < ESTAGIOS.logo && <AppRegistro velocidade={velocidade.current} duracao={4 * BATIDA} mascarar={estagio >= ESTAGIOS.mascara} />}
      {estagio >= ESTAGIOS.logo && estagio < ESTAGIOS.manifesto && <LogoLithium quadro={(estagio - ESTAGIOS.logo) % 2} reinicio={estagio} />}
      {estagio === ESTAGIOS.manifesto && <TakeManifesto inicioEm={agenda.current[ESTAGIOS.manifesto]} />}
      {estagio === ESTAGIOS.numeros && <TakeNumeros />}
      {estagio === ESTAGIOS.calendario && <TakeCalendario />}
      {estagio === ESTAGIOS.arsenal && <TakeArsenal inicioEm={agenda.current[ESTAGIOS.arsenal]} />}
      {estagio === ESTAGIOS.faca && <TakeFaca aoRepetir={aoRepetir} replayEm={FIM_DA_MUSICA.duracao + REPLAY_APOS} />}
    </>
  );
}
