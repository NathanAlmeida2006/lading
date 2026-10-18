import { CampoDePontos } from "./CampoDePontos.jsx";
import { TelaDoApp, ZOOM } from "./TelaDoApp.jsx";
import { MASCARA_DA_LOGO } from "./LogoLithium.jsx";
import "../styles/app-registro.css";

/**
 * A tela Registro do app Lithium (sem registros), como no app em execucao (390 px, `app-lithium/src/telas/Registros.jsx`
 * + Casca): sem a barra de navegacao e sem o objeto 3D do pe. O CSS vive em styles/app-registro.css, restrito a
 * `.app-registro` (@scope). Entra ja rolando e aproximado, com o cartao "Hoje" onde o ultimo no do mapa da Trilha parou (match cut em
 * zoom), na mesma velocidade da Trilha, e anda por `duracao` ms. Na batida em que `mascarar` liga, vira o recheio da logo
 * (TelaDoApp): a logo comeca tao grande que cobre a tela e encolhe, com a tela rolando dentro das letras. O conteudo vem duas
 * vezes, para haver o que rolar ate o fim desse efeito.
 */
export function AppRegistro({ velocidade, duracao, mascarar }) {
  return (
    <TelaDoApp escopo="app-registro" de={{ alvo: ".calendario-dia .estado-vazio", y: 300 }} velocidade={velocidade} duracao={duracao} zoomEntrada={{ escala: ZOOM.escala, ms: ZOOM.entrada }} mascarar={mascarar && MASCARA_DA_LOGO}>
<div className="app-shell" data-pilar="hipertrofia">
<div className="app-corpo">
<header className="barra-superior"><a className="marca-topo" aria-label="Lithium, início"><img className="wordmark" alt="" width="104" height="28" src="/lithium-wordmark.svg" /></a>
<div className="barra-acoes"><a className="botao-icone" aria-label="Social Vibe" title="Social Vibe"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"></path></svg></a></div></header>
<main id="conteudo" tabIndex="-1" data-rota="registros">
<div className="hoje-tela registro-tela">
<section className="registro-abertura" aria-labelledby="registro-titulo"><CampoDePontos />
<div className="registro-envelope">
<header className="registro-cabeca">
<div><p className="sobretitulo">sábado, 17 de outubro</p><h1 id="registro-titulo" tabIndex="-1" data-revelar="">Registro.</h1></div><p className="registro-tese">Treino, sono, dieta e peso.<br />Anote o dia e volte ao que já fez sempre que precisar.</p></header>
<div className="registro-acoes" role="group" aria-label="Anotar no seu dia"><button className="registro-acao" aria-label="Treino" aria-describedby="registro-dica-treino"><span className="registro-acao-topo"><svg width="22" height="22" viewBox="0.79 0.79 22.41 22.41" fill="none" stroke="currentColor" strokeWidth="1.401" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true"><path d="M3 8v8M6 5v14M18 5v14M21 8v8M6 12h12"></path></svg><span>Anotar</span></span><strong className="registro-acao-titulo">Treino</strong><span className="registro-acao-descricao" id="registro-dica-treino">Sua ficha, séries e cargas.</span><span className="registro-acao-rodape">Anotar treino<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"></path></svg></span></button><button className="registro-acao" aria-label="Noite" aria-describedby="registro-dica-sono"><span className="registro-acao-topo"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true"><path d="M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11Z"></path></svg><span>Anotar</span></span><strong className="registro-acao-titulo">Noite</strong><span className="registro-acao-descricao" id="registro-dica-sono">Como foi o seu sono.</span><span className="registro-acao-rodape">Anotar noite<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"></path></svg></span></button><button className="registro-acao" aria-label="Peso" aria-describedby="registro-dica-peso"><span className="registro-acao-topo"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true"><path d="M9 3H3v6M15 3h6v6M3 15v6h6M21 15v6h-6M8 12h8M12 8v8"></path></svg><span>Anotar</span></span><strong className="registro-acao-titulo">Peso</strong><span className="registro-acao-descricao" id="registro-dica-peso">Uma medida de cada vez.</span><span className="registro-acao-rodape">Anotar peso<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"></path></svg></span></button><button className="registro-acao" aria-label="Dieta" aria-describedby="registro-dica-dieta"><span className="registro-acao-topo"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true"><path d="M5 3v7M2 3v4a3 3 0 0 0 6 0V3M5 10v11M19 3c-5 4-5 9 0 9V3v18"></path></svg><span>Anotar</span></span><strong className="registro-acao-titulo">Dieta</strong><span className="registro-acao-descricao" id="registro-dica-dieta">Toque no que comeu, sem digitar.</span><span className="registro-acao-rodape">Anotar dieta<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"></path></svg></span></button></div></div></section>
<section className="regua-bloco registro-calendario" aria-labelledby="registro-calendario-titulo"><CampoDePontos variante="estelar" />
<div className="regua-grade">
<header className="regua-cabeca"><p className="sobretitulo">(mês a mês)</p><h2 id="registro-calendario-titulo">Calendário</h2><p className="registro-intro">Cada marca é um registro. Toque num dia para ver o que tem ou anotar o que faltou.</p></header>
<div className="registro-miolo">
<div className="calendario">
<div className="calendario-cabeca"><button className="botao-icone" aria-label="Mês anterior"><span aria-hidden="true">‹</span></button><h3 aria-live="polite">outubro de 2026</h3><button className="botao-icone" disabled aria-label="Próximo mês"><span aria-hidden="true">›</span></button></div>
<ol className="calendario-grade" aria-label="Dias de outubro de 2026">
<li className="calendario-semana" aria-hidden="true">S</li>
<li className="calendario-semana" aria-hidden="true">T</li>
<li className="calendario-semana" aria-hidden="true">Q</li>
<li className="calendario-semana" aria-hidden="true">Q</li>
<li className="calendario-semana" aria-hidden="true">S</li>
<li className="calendario-semana" aria-hidden="true">S</li>
<li className="calendario-semana" aria-hidden="true">D</li>
<li aria-hidden="true"></li>
<li aria-hidden="true"></li>
<li aria-hidden="true"></li>
<li><button aria-pressed="false" aria-label="1 de outubro"><span>1</span><span className="calendario-marcas" aria-hidden="true"></span></button></li>
<li><button aria-pressed="false" aria-label="2 de outubro"><span>2</span><span className="calendario-marcas" aria-hidden="true"></span></button></li>
<li><button aria-pressed="false" aria-label="3 de outubro"><span>3</span><span className="calendario-marcas" aria-hidden="true"></span></button></li>
<li><button aria-pressed="false" aria-label="4 de outubro"><span>4</span><span className="calendario-marcas" aria-hidden="true"></span></button></li>
<li><button aria-pressed="false" aria-label="5 de outubro"><span>5</span><span className="calendario-marcas" aria-hidden="true"></span></button></li>
<li><button aria-pressed="false" aria-label="6 de outubro"><span>6</span><span className="calendario-marcas" aria-hidden="true"></span></button></li>
<li><button aria-pressed="false" aria-label="7 de outubro"><span>7</span><span className="calendario-marcas" aria-hidden="true"></span></button></li>
<li><button aria-pressed="false" aria-label="8 de outubro"><span>8</span><span className="calendario-marcas" aria-hidden="true"></span></button></li>
<li><button aria-pressed="false" aria-label="9 de outubro"><span>9</span><span className="calendario-marcas" aria-hidden="true"></span></button></li>
<li><button aria-pressed="false" aria-label="10 de outubro"><span>10</span><span className="calendario-marcas" aria-hidden="true"></span></button></li>
<li><button aria-pressed="false" aria-label="11 de outubro"><span>11</span><span className="calendario-marcas" aria-hidden="true"></span></button></li>
<li><button aria-pressed="false" aria-label="12 de outubro"><span>12</span><span className="calendario-marcas" aria-hidden="true"></span></button></li>
<li><button aria-pressed="false" aria-label="13 de outubro"><span>13</span><span className="calendario-marcas" aria-hidden="true"></span></button></li>
<li><button aria-pressed="false" aria-label="14 de outubro"><span>14</span><span className="calendario-marcas" aria-hidden="true"></span></button></li>
<li><button aria-pressed="false" aria-label="15 de outubro"><span>15</span><span className="calendario-marcas" aria-hidden="true"></span></button></li>
<li><button aria-pressed="false" aria-label="16 de outubro"><span>16</span><span className="calendario-marcas" aria-hidden="true"></span></button></li>
<li><button aria-pressed="true" aria-label="17 de outubro" data-hoje="true"><span>17</span><span className="calendario-marcas" aria-hidden="true"></span></button></li>
<li><button aria-pressed="false" aria-label="18 de outubro" disabled><span>18</span><span className="calendario-marcas" aria-hidden="true"></span></button></li>
<li><button aria-pressed="false" aria-label="19 de outubro" disabled><span>19</span><span className="calendario-marcas" aria-hidden="true"></span></button></li>
<li><button aria-pressed="false" aria-label="20 de outubro" disabled><span>20</span><span className="calendario-marcas" aria-hidden="true"></span></button></li>
<li><button aria-pressed="false" aria-label="21 de outubro" disabled><span>21</span><span className="calendario-marcas" aria-hidden="true"></span></button></li>
<li><button aria-pressed="false" aria-label="22 de outubro" disabled><span>22</span><span className="calendario-marcas" aria-hidden="true"></span></button></li>
<li><button aria-pressed="false" aria-label="23 de outubro" disabled><span>23</span><span className="calendario-marcas" aria-hidden="true"></span></button></li>
<li><button aria-pressed="false" aria-label="24 de outubro" disabled><span>24</span><span className="calendario-marcas" aria-hidden="true"></span></button></li>
<li><button aria-pressed="false" aria-label="25 de outubro" disabled><span>25</span><span className="calendario-marcas" aria-hidden="true"></span></button></li>
<li><button aria-pressed="false" aria-label="26 de outubro" disabled><span>26</span><span className="calendario-marcas" aria-hidden="true"></span></button></li>
<li><button aria-pressed="false" aria-label="27 de outubro" disabled><span>27</span><span className="calendario-marcas" aria-hidden="true"></span></button></li>
<li><button aria-pressed="false" aria-label="28 de outubro" disabled><span>28</span><span className="calendario-marcas" aria-hidden="true"></span></button></li>
<li><button aria-pressed="false" aria-label="29 de outubro" disabled><span>29</span><span className="calendario-marcas" aria-hidden="true"></span></button></li>
<li><button aria-pressed="false" aria-label="30 de outubro" disabled><span>30</span><span className="calendario-marcas" aria-hidden="true"></span></button></li>
<li><button aria-pressed="false" aria-label="31 de outubro" disabled><span>31</span><span className="calendario-marcas" aria-hidden="true"></span></button></li></ol>
<ul className="calendario-legenda" aria-hidden="true">
<li><i data-tipo="treino"></i>Treino</li>
<li><i data-tipo="sono"></i>Sono</li>
<li><i data-tipo="dieta"></i>Dieta</li>
<li><i data-tipo="peso"></i>Peso</li></ul>
<section className="calendario-dia" aria-labelledby="calendario-dia-titulo"><h3 id="calendario-dia-titulo">Hoje</h3>
<div className="estado-vazio"><svg width="22" height="22" viewBox="1.63 1.63 20.75 20.75" fill="none" stroke="currentColor" strokeWidth="1.297" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true"><path d="M6 3h12v18H6ZM9 7h6M9 11h6M9 15h4"></path></svg><p>Nada anotado neste dia. Dá para anotar agora:</p>
<div className="calendario-acoes" role="group" aria-label="Anotar neste dia"><button className="botao secundario"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true"><path d="M12 5v14M5 12h14"></path></svg>Treino</button><button className="botao secundario"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true"><path d="M12 5v14M5 12h14"></path></svg>Sono</button><button className="botao secundario"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true"><path d="M12 5v14M5 12h14"></path></svg>Dieta</button><button className="botao secundario"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true"><path d="M12 5v14M5 12h14"></path></svg>Peso</button></div></div></section></div></div></div></section>
<section className="regua-bloco registro-historico" aria-labelledby="registro-historico-titulo"><CampoDePontos variante="estelar" />
<div className="regua-grade">
<header className="regua-cabeca"><p className="sobretitulo">(dia após dia)</p><h2 id="registro-historico-titulo">Histórico</h2><p className="registro-intro">O que aconteceu, do mais recente ao mais antigo. Você pode editar cada registro.</p><a className="botao-texto">Ver evolução em EU<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"></path></svg></a></header>
<div className="registro-miolo">
<div className="registro-ferramentas"><label className="periodo"><span>Período</span><select><option value="todos">Todo o histórico</option><option value="7">Últimos 7 dias</option><option value="30">Últimos 30 dias</option></select></label>
<div className="abas-dados" role="group" aria-label="Filtrar registros"><button aria-pressed="true">Todos</button><button aria-pressed="false">Treino</button><button aria-pressed="false">Dieta</button><button aria-pressed="false">Sono</button><button aria-pressed="false">Peso</button></div>
<div className="registro-resultado"><p role="status">Seu histórico</p></div></div>
<div className="estado-vazio"><svg width="22" height="22" viewBox="1.63 1.63 20.75 20.75" fill="none" stroke="currentColor" strokeWidth="1.297" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true"><path d="M6 3h12v18H6ZM9 7h6M9 11h6M9 15h4"></path></svg><p>O seu histórico começa no primeiro registro.</p><button className="botao secundario">Anotar um treino<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"></path></svg></button></div></div></div></section>
<section className="regua-bloco registro-apoio" aria-labelledby="registro-kit-titulo"><CampoDePontos variante="estelar" />
<div className="regua-grade">
<header className="regua-cabeca"><p className="sobretitulo">(o kit)</p><h2 id="registro-kit-titulo">Na hora de anotar</h2><p className="registro-intro">A ficha, o checklist e o diário para consultar quando precisar.</p><a className="botao-texto">Abrir o Kit <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"></path></svg></a></header>
<div className="registro-miolo">
<ul className="kit-lista">
<li><button type="button">
<div><span className="sobretitulo">ANEXO A1</span><strong>Ficha de treino</strong></div><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"></path></svg></button></li>
<li><a>
<div><span className="sobretitulo">ANEXO A2</span><strong>Checklist semanal</strong></div><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"></path></svg></a></li>
<li><button type="button">
<div><span className="sobretitulo">ANEXO A7</span><strong>Diário de 1 minuto</strong></div><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"></path></svg></button></li></ul></div></div></section></div></main></div></div>
<div className="app-shell" data-pilar="hipertrofia">
<div className="app-corpo">
<header className="barra-superior"><a className="marca-topo" aria-label="Lithium, início"><img className="wordmark" alt="" width="104" height="28" src="/lithium-wordmark.svg" /></a>
<div className="barra-acoes"><a className="botao-icone" aria-label="Social Vibe" title="Social Vibe"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"></path></svg></a></div></header>
<main id="conteudo" tabIndex="-1" data-rota="registros">
<div className="hoje-tela registro-tela">
<section className="registro-abertura" aria-labelledby="registro-titulo"><CampoDePontos />
<div className="registro-envelope">
<header className="registro-cabeca">
<div><p className="sobretitulo">sábado, 17 de outubro</p><h1 id="registro-titulo" tabIndex="-1" data-revelar="">Registro.</h1></div><p className="registro-tese">Treino, sono, dieta e peso.<br />Anote o dia e volte ao que já fez sempre que precisar.</p></header>
<div className="registro-acoes" role="group" aria-label="Anotar no seu dia"><button className="registro-acao" aria-label="Treino" aria-describedby="registro-dica-treino"><span className="registro-acao-topo"><svg width="22" height="22" viewBox="0.79 0.79 22.41 22.41" fill="none" stroke="currentColor" strokeWidth="1.401" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true"><path d="M3 8v8M6 5v14M18 5v14M21 8v8M6 12h12"></path></svg><span>Anotar</span></span><strong className="registro-acao-titulo">Treino</strong><span className="registro-acao-descricao" id="registro-dica-treino">Sua ficha, séries e cargas.</span><span className="registro-acao-rodape">Anotar treino<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"></path></svg></span></button><button className="registro-acao" aria-label="Noite" aria-describedby="registro-dica-sono"><span className="registro-acao-topo"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true"><path d="M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11Z"></path></svg><span>Anotar</span></span><strong className="registro-acao-titulo">Noite</strong><span className="registro-acao-descricao" id="registro-dica-sono">Como foi o seu sono.</span><span className="registro-acao-rodape">Anotar noite<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"></path></svg></span></button><button className="registro-acao" aria-label="Peso" aria-describedby="registro-dica-peso"><span className="registro-acao-topo"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true"><path d="M9 3H3v6M15 3h6v6M3 15v6h6M21 15v6h-6M8 12h8M12 8v8"></path></svg><span>Anotar</span></span><strong className="registro-acao-titulo">Peso</strong><span className="registro-acao-descricao" id="registro-dica-peso">Uma medida de cada vez.</span><span className="registro-acao-rodape">Anotar peso<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"></path></svg></span></button><button className="registro-acao" aria-label="Dieta" aria-describedby="registro-dica-dieta"><span className="registro-acao-topo"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true"><path d="M5 3v7M2 3v4a3 3 0 0 0 6 0V3M5 10v11M19 3c-5 4-5 9 0 9V3v18"></path></svg><span>Anotar</span></span><strong className="registro-acao-titulo">Dieta</strong><span className="registro-acao-descricao" id="registro-dica-dieta">Toque no que comeu, sem digitar.</span><span className="registro-acao-rodape">Anotar dieta<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"></path></svg></span></button></div></div></section>
<section className="regua-bloco registro-calendario" aria-labelledby="registro-calendario-titulo"><CampoDePontos variante="estelar" />
<div className="regua-grade">
<header className="regua-cabeca"><p className="sobretitulo">(mês a mês)</p><h2 id="registro-calendario-titulo">Calendário</h2><p className="registro-intro">Cada marca é um registro. Toque num dia para ver o que tem ou anotar o que faltou.</p></header>
<div className="registro-miolo">
<div className="calendario">
<div className="calendario-cabeca"><button className="botao-icone" aria-label="Mês anterior"><span aria-hidden="true">‹</span></button><h3 aria-live="polite">outubro de 2026</h3><button className="botao-icone" disabled aria-label="Próximo mês"><span aria-hidden="true">›</span></button></div>
<ol className="calendario-grade" aria-label="Dias de outubro de 2026">
<li className="calendario-semana" aria-hidden="true">S</li>
<li className="calendario-semana" aria-hidden="true">T</li>
<li className="calendario-semana" aria-hidden="true">Q</li>
<li className="calendario-semana" aria-hidden="true">Q</li>
<li className="calendario-semana" aria-hidden="true">S</li>
<li className="calendario-semana" aria-hidden="true">S</li>
<li className="calendario-semana" aria-hidden="true">D</li>
<li aria-hidden="true"></li>
<li aria-hidden="true"></li>
<li aria-hidden="true"></li>
<li><button aria-pressed="false" aria-label="1 de outubro"><span>1</span><span className="calendario-marcas" aria-hidden="true"></span></button></li>
<li><button aria-pressed="false" aria-label="2 de outubro"><span>2</span><span className="calendario-marcas" aria-hidden="true"></span></button></li>
<li><button aria-pressed="false" aria-label="3 de outubro"><span>3</span><span className="calendario-marcas" aria-hidden="true"></span></button></li>
<li><button aria-pressed="false" aria-label="4 de outubro"><span>4</span><span className="calendario-marcas" aria-hidden="true"></span></button></li>
<li><button aria-pressed="false" aria-label="5 de outubro"><span>5</span><span className="calendario-marcas" aria-hidden="true"></span></button></li>
<li><button aria-pressed="false" aria-label="6 de outubro"><span>6</span><span className="calendario-marcas" aria-hidden="true"></span></button></li>
<li><button aria-pressed="false" aria-label="7 de outubro"><span>7</span><span className="calendario-marcas" aria-hidden="true"></span></button></li>
<li><button aria-pressed="false" aria-label="8 de outubro"><span>8</span><span className="calendario-marcas" aria-hidden="true"></span></button></li>
<li><button aria-pressed="false" aria-label="9 de outubro"><span>9</span><span className="calendario-marcas" aria-hidden="true"></span></button></li>
<li><button aria-pressed="false" aria-label="10 de outubro"><span>10</span><span className="calendario-marcas" aria-hidden="true"></span></button></li>
<li><button aria-pressed="false" aria-label="11 de outubro"><span>11</span><span className="calendario-marcas" aria-hidden="true"></span></button></li>
<li><button aria-pressed="false" aria-label="12 de outubro"><span>12</span><span className="calendario-marcas" aria-hidden="true"></span></button></li>
<li><button aria-pressed="false" aria-label="13 de outubro"><span>13</span><span className="calendario-marcas" aria-hidden="true"></span></button></li>
<li><button aria-pressed="false" aria-label="14 de outubro"><span>14</span><span className="calendario-marcas" aria-hidden="true"></span></button></li>
<li><button aria-pressed="false" aria-label="15 de outubro"><span>15</span><span className="calendario-marcas" aria-hidden="true"></span></button></li>
<li><button aria-pressed="false" aria-label="16 de outubro"><span>16</span><span className="calendario-marcas" aria-hidden="true"></span></button></li>
<li><button aria-pressed="true" aria-label="17 de outubro" data-hoje="true"><span>17</span><span className="calendario-marcas" aria-hidden="true"></span></button></li>
<li><button aria-pressed="false" aria-label="18 de outubro" disabled><span>18</span><span className="calendario-marcas" aria-hidden="true"></span></button></li>
<li><button aria-pressed="false" aria-label="19 de outubro" disabled><span>19</span><span className="calendario-marcas" aria-hidden="true"></span></button></li>
<li><button aria-pressed="false" aria-label="20 de outubro" disabled><span>20</span><span className="calendario-marcas" aria-hidden="true"></span></button></li>
<li><button aria-pressed="false" aria-label="21 de outubro" disabled><span>21</span><span className="calendario-marcas" aria-hidden="true"></span></button></li>
<li><button aria-pressed="false" aria-label="22 de outubro" disabled><span>22</span><span className="calendario-marcas" aria-hidden="true"></span></button></li>
<li><button aria-pressed="false" aria-label="23 de outubro" disabled><span>23</span><span className="calendario-marcas" aria-hidden="true"></span></button></li>
<li><button aria-pressed="false" aria-label="24 de outubro" disabled><span>24</span><span className="calendario-marcas" aria-hidden="true"></span></button></li>
<li><button aria-pressed="false" aria-label="25 de outubro" disabled><span>25</span><span className="calendario-marcas" aria-hidden="true"></span></button></li>
<li><button aria-pressed="false" aria-label="26 de outubro" disabled><span>26</span><span className="calendario-marcas" aria-hidden="true"></span></button></li>
<li><button aria-pressed="false" aria-label="27 de outubro" disabled><span>27</span><span className="calendario-marcas" aria-hidden="true"></span></button></li>
<li><button aria-pressed="false" aria-label="28 de outubro" disabled><span>28</span><span className="calendario-marcas" aria-hidden="true"></span></button></li>
<li><button aria-pressed="false" aria-label="29 de outubro" disabled><span>29</span><span className="calendario-marcas" aria-hidden="true"></span></button></li>
<li><button aria-pressed="false" aria-label="30 de outubro" disabled><span>30</span><span className="calendario-marcas" aria-hidden="true"></span></button></li>
<li><button aria-pressed="false" aria-label="31 de outubro" disabled><span>31</span><span className="calendario-marcas" aria-hidden="true"></span></button></li></ol>
<ul className="calendario-legenda" aria-hidden="true">
<li><i data-tipo="treino"></i>Treino</li>
<li><i data-tipo="sono"></i>Sono</li>
<li><i data-tipo="dieta"></i>Dieta</li>
<li><i data-tipo="peso"></i>Peso</li></ul>
<section className="calendario-dia" aria-labelledby="calendario-dia-titulo"><h3 id="calendario-dia-titulo">Hoje</h3>
<div className="estado-vazio"><svg width="22" height="22" viewBox="1.63 1.63 20.75 20.75" fill="none" stroke="currentColor" strokeWidth="1.297" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true"><path d="M6 3h12v18H6ZM9 7h6M9 11h6M9 15h4"></path></svg><p>Nada anotado neste dia. Dá para anotar agora:</p>
<div className="calendario-acoes" role="group" aria-label="Anotar neste dia"><button className="botao secundario"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true"><path d="M12 5v14M5 12h14"></path></svg>Treino</button><button className="botao secundario"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true"><path d="M12 5v14M5 12h14"></path></svg>Sono</button><button className="botao secundario"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true"><path d="M12 5v14M5 12h14"></path></svg>Dieta</button><button className="botao secundario"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true"><path d="M12 5v14M5 12h14"></path></svg>Peso</button></div></div></section></div></div></div></section>
<section className="regua-bloco registro-historico" aria-labelledby="registro-historico-titulo"><CampoDePontos variante="estelar" />
<div className="regua-grade">
<header className="regua-cabeca"><p className="sobretitulo">(dia após dia)</p><h2 id="registro-historico-titulo">Histórico</h2><p className="registro-intro">O que aconteceu, do mais recente ao mais antigo. Você pode editar cada registro.</p><a className="botao-texto">Ver evolução em EU<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"></path></svg></a></header>
<div className="registro-miolo">
<div className="registro-ferramentas"><label className="periodo"><span>Período</span><select><option value="todos">Todo o histórico</option><option value="7">Últimos 7 dias</option><option value="30">Últimos 30 dias</option></select></label>
<div className="abas-dados" role="group" aria-label="Filtrar registros"><button aria-pressed="true">Todos</button><button aria-pressed="false">Treino</button><button aria-pressed="false">Dieta</button><button aria-pressed="false">Sono</button><button aria-pressed="false">Peso</button></div>
<div className="registro-resultado"><p role="status">Seu histórico</p></div></div>
<div className="estado-vazio"><svg width="22" height="22" viewBox="1.63 1.63 20.75 20.75" fill="none" stroke="currentColor" strokeWidth="1.297" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true"><path d="M6 3h12v18H6ZM9 7h6M9 11h6M9 15h4"></path></svg><p>O seu histórico começa no primeiro registro.</p><button className="botao secundario">Anotar um treino<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"></path></svg></button></div></div></div></section>
<section className="regua-bloco registro-apoio" aria-labelledby="registro-kit-titulo"><CampoDePontos variante="estelar" />
<div className="regua-grade">
<header className="regua-cabeca"><p className="sobretitulo">(o kit)</p><h2 id="registro-kit-titulo">Na hora de anotar</h2><p className="registro-intro">A ficha, o checklist e o diário para consultar quando precisar.</p><a className="botao-texto">Abrir o Kit <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"></path></svg></a></header>
<div className="registro-miolo">
<ul className="kit-lista">
<li><button type="button">
<div><span className="sobretitulo">ANEXO A1</span><strong>Ficha de treino</strong></div><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"></path></svg></button></li>
<li><a>
<div><span className="sobretitulo">ANEXO A2</span><strong>Checklist semanal</strong></div><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"></path></svg></a></li>
<li><button type="button">
<div><span className="sobretitulo">ANEXO A7</span><strong>Diário de 1 minuto</strong></div><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"></path></svg></button></li></ul></div></div></section></div></main></div></div>
    </TelaDoApp>
  );
}
