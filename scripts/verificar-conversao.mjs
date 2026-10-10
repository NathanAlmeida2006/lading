/**
 * T14: integração em fixture SSR/hidratação real + E2E do preview informado.
 * node scripts/verificar-conversao.mjs http://127.0.0.1:4186/
 * CHROMIUM=/caminho/chrome; ARTIFACT_DIR=output/playwright/t14/testes
 * Não instala dependências, não escreve produto/dist, não acessa rede externa.
 * Fixture usa os módulos reais; somente configuração sintética, relógio, saída
 * fbq e destino checkout são controlados. Não comprova RF-L27 nem CRO.
 */
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createServer } from 'vite';
import { chromium } from 'playwright-core';

const alvo = process.argv[2] ?? 'http://127.0.0.1:4186/';
const pasta = path.resolve(process.env.ARTIFACT_DIR ?? 'output/playwright/t14/testes');
const inicioExecucao = new Date().toISOString();
await mkdir(pasta, { recursive: true });
const resultados = [];
const consoles = [];
let browser, servidor;
const inicio = Date.parse('2026-10-09T12:00:00+00:00');
const fim = Date.parse('2026-10-09T13:00:00+00:00');
const agora = inicio + 30 * 60 * 1000;
const condicao = { texto: 'FIXTURE condição comercial de teste', fonte: 'fixture-t14',
  inicio: '2026-10-09T12:00:00+00:00', fim: '2026-10-09T13:00:00+00:00',
  fuso: 'UTC', referenciaComercial: 'fixture-t14', confirmado: true,
  dataConfirmacao: '2026-10-08T12:00:00+00:00', identificadorCheckout: 'fixture-t14' };

// Módulo virtual só de teste. Nenhum transform substitui a instrumentação,
// componentes, regra de oferta ou IntersectionObserver do navegador.
const fonteFixture = `
import React, {useEffect, useState} from 'react';
import {hydrateRoot} from 'react-dom/client';
import {renderToString} from 'react-dom/server';
import {config} from '/src/config.js';
import * as instrumentacao from '/src/instrumentacao.js';
import * as oferta from '/src/oferta.js';
import {Botao} from '/src/components/Botao.jsx';
import {ProvaSocial} from '/src/sections/ProvaSocial.jsx';
import {PerguntasFrequentes} from '/src/components/PerguntasFrequentes.jsx';
import {CondicaoOferta} from '/src/components/CondicaoOferta.jsx';
import {conteudo} from '/src/conteudo.js';
const h=React.createElement;
let dados;
export function configurar(d) {
 dados=d; config.pixel={id:'123456789012345'};
 config.checkout={url:'https://checkout.t14.invalid/oferta?utm_medium=base#pagar',urlConfirmada:true,parametroRastreio:'sck',parametroConfirmado:true,identificadorOferta:'fixture-t14'};
 config.oferta={disponivel:d.base, referenciaComercial:'fixture-t14',condicaoOferta:d.condicao};
}
const alcance={mapa:{etapa:4,canonico:true},amostra:{etapa:6,canonico:true},oferta:{etapa:7},objecoes:{etapa:9,canonico:true}};
function Fixture() {
 const [params,setParams]=useState({});
 const estado=oferta.useCondicaoOferta(config.oferta,config.checkout);
 useEffect(()=>{setParams(instrumentacao.capturarParametros()); return instrumentacao.iniciarMensuracao(alcance);},[]);
 useEffect(()=>{document.documentElement.classList.add('fixture-pronta');},[]);
 const relatos=Array.from({length:dados.relatos},(_,i)=>({id:'fixture-'+i,texto:'FIXTURE relato sintético '+i,identificacao:'Pessoa sintética '+i,aprovado:true,origem:'fixture-t14',autorizacaoRef:'fixture'}));
 return h('main',null,
  h('section',{id:'instrumentos'},h('h1',null,'Fixture isolada T14'),h(Botao,{params,posicao:'fixture'}),h(CondicaoOferta,{condicao:estado.condicao,estado:estado.estado})),
  h('section',{id:'relatos'},h(ProvaSocial,{depoimentos:relatos})),
  h('section',{id:'faq'},h(PerguntasFrequentes,{itens:conteudo.objecoes})),
  ...Object.keys(alcance).map(id=>h('section',{id,key:id,style:{minHeight:'1000px',paddingTop:'8px'}},h('h2',null,'FIXTURE seção '+id))),
  h('div',{style:{height:'1000px'}},'Fim fixture'));
}
export function renderizar(d) { configurar(d);return renderToString(h(Fixture)); }
if(typeof window!=='undefined') {
 configurar(window.__T14_DADOS__);
 window.__T14__={...instrumentacao,...oferta,config,reiniciar:()=>instrumentacao.iniciarMensuracao(alcance)};
 hydrateRoot(document.getElementById('fixture'),h(React.StrictMode,null,h(Fixture)));
}
`;
async function testar(id, nivel, requisitos, descricao, executar) {
 const timestamp=new Date().toISOString(), t=performance.now();
 try {
  const observado=await executar();
  resultados.push({id,nivel,requisitos,descricao,estado:'passou',inicio:timestamp,duracao_ms:Math.round(performance.now()-t),tentativas:1,observado});
  console.log(`${id} PASSOU ${descricao}`);
 } catch(e) {
  resultados.push({id,nivel,requisitos,descricao,estado:'falhou',inicio:timestamp,duracao_ms:Math.round(performance.now()-t),tentativas:1,observado:String(e.stack)});
  console.log(`${id} FALHOU ${e.message}`);
 }
}
const quadro = p => p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
async function rolar(p,y) { await p.evaluate(y=>window.scrollTo({top:y,behavior:'instant'}),y);await quadro(p); }
const topo = (p,id) => p.locator('#'+id).evaluate(el=>el.getBoundingClientRect().top+scrollY);
async function abrir(url,{viewport={width:360,height:640},resposta=null,clock=agora,js=true,chunkFail=false}={}) {
 const ctx=await browser.newContext({viewport,reducedMotion:'reduce',hasTouch:true,isMobile:true,javaScriptEnabled:js});
 const estado={fbq:[],scripts:0,checkouts:[],externasBloqueadas:[],chunksAbortados:[],erros:[]};
 await ctx.exposeBinding('__t14fbq',(_,a)=>estado.fbq.push(a));
 await ctx.addInitScript(({resposta,clock})=>{
  window.__T14_NOW__=clock;Date.now=()=>window.__T14_NOW__;
  if(resposta!==null)sessionStorage.setItem('fluor:consentimento',JSON.stringify(resposta));
 },{resposta,clock});
 const permitidas=new Set([new URL(url).origin,new URL(alvo).origin]);
 await ctx.route('**/*',async rota=>{
  const u=new URL(rota.request().url());
  if(chunkFail&&/\/assets\/coreografias-[^/]+\.js$/.test(u.pathname)){estado.chunksAbortados.push(u.href);return rota.abort();}
  if(u.hostname==='connect.facebook.net'){
   estado.scripts++;
   return rota.fulfill({contentType:'application/javascript',body:`const f=window.fbq;const q=f.queue.splice(0);f.callMethod=function(){window.__t14fbq(Array.from(arguments));if(window.__trackerFalha)throw Error('fixture tracker falhou');};q.forEach(a=>f.callMethod.apply(f,a));`});
  }
  if(u.hostname==='checkout.t14.invalid'){estado.checkouts.push(u.href);return rota.fulfill({contentType:'text/html',body:'<title>Checkout sintético</title>Destino interceptado T14'});}
  if(!permitidas.has(u.origin)&&!['data:','blob:'].includes(u.protocol)){estado.externasBloqueadas.push(u.href);return rota.abort();}
  return rota.continue();
 });
 const p=await ctx.newPage();
 p.on('pageerror',e=>estado.erros.push(String(e)));
 p.on('console',m=>{if(m.type()==='error')consoles.push({url,texto:m.text()});});
 await p.goto(url,{waitUntil:'networkidle'});
 if(js)await p.waitForFunction(()=>document.documentElement.classList.contains('fixture-pronta')||document.documentElement.classList.contains('pronto'));
 const eventos=n=>estado.fbq.filter(a=>a[1]===n);
 return {p,ctx,estado,eventos};
}
let fixtureUrl;
function fixtureQuery(d={}) {
 return fixtureUrl+'?'+new URLSearchParams({relatos:String(d.relatos??3),condicao:d.condicao??'ausente',base:String(d.base??true),...(d.query??{})});
}
async function comPagina(url,opcoes,fn) {const f=await abrir(url,opcoes);try{return await fn(f);}finally{await f.ctx.close();}}
try {
 servidor=await createServer({logLevel:'error',server:{host:'127.0.0.1',port:0,strictPort:false,hmr:false},plugins:[{
  name:'t14-fixture-virtual',enforce:'pre',resolveId(id){if(id==='virtual:t14')return '\0t14-fixture';},
  load(id){if(id==='\0t14-fixture')return fonteFixture;},
  configureServer(s){s.middlewares.use(async(req,res,next)=>{
   const u=new URL(req.url,'http://fixture.invalid');if(u.pathname!=='/__t14__/')return next();
   try{
    const dados={relatos:Number(u.searchParams.get('relatos')??3),base:u.searchParams.get('base')!=='false',condicao:u.searchParams.get('condicao')==='datada'?condicao:null};
    const m=await s.ssrLoadModule('virtual:t14');
    const html=`<!doctype html><html lang="pt-BR"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Fixture T14</title><script>document.documentElement.classList.add('js')</script>${['tokens/cor','tokens/forma-espaco','tokens/movimento','fontes','tailwind'].map(f=>`<link rel="stylesheet" href="/src/styles/${f}.css?direct">`).join('')}<style>html{scroll-behavior:auto}body{margin:0}main{padding:16px}#instrumentos,#relatos,#faq{margin-bottom:32px}#instrumentos{min-height:180px}</style></head><body><div id="fixture">${m.renderizar(dados)}</div><script>window.__T14_DADOS__=${JSON.stringify(dados).replaceAll('<','\\u003c')}</script><script type="module">import 'virtual:t14'</script></body></html>`;
    res.setHeader('Content-Type','text/html; charset=utf-8');res.end(await s.transformIndexHtml(req.url,html));
   }catch(e){res.statusCode=500;res.end(String(e.stack));}
  });}
 }]});
 await servidor.listen();
 fixtureUrl=`http://127.0.0.1:${servidor.httpServer.address().port}/__t14__/`;
 browser=await chromium.launch({headless:true,...(process.env.CHROMIUM?{executablePath:process.env.CHROMIUM}: {})});

 for(const resposta of [null,false])await testar(`T14-EVENTOS-${resposta===null?'sem-resposta':'recusa'}`,'integracao',['RNF-L23','RF-L29'],'sem consentimento: rolagem + CTA não enviam',()=>comPagina(fixtureQuery(),{resposta},async f=>{
  for(const id of ['mapa','amostra','oferta','objecoes'])await rolar(f.p,await topo(f.p,id));
  await rolar(f.p,0);await f.p.locator('a[data-posicao=fixture]').click();
  assert.equal(f.estado.fbq.length,0);assert.equal(f.estado.scripts,0);assert.equal(f.estado.checkouts.length,1);
  return f.estado;
 }));

 await testar('T14-EVENTOS-tardio','integracao',['RNF-L28','RNF-L23','RF-L31'],'aceite tardio na oferta; somente visível; revisita e remontagem deduplicam',()=>comPagina(fixtureQuery(),{},async f=>{
  await rolar(f.p,await topo(f.p,'oferta'));
  await f.p.evaluate(()=>window.__T14__.responderConsentimento(true));
  await f.p.waitForFunction(()=>!!window.fbq?.callMethod);await quadro(f.p);
  assert.equal(f.eventos('PageView').length,1);assert.equal(f.eventos('ViewContent').length,1);
  assert.equal(f.eventos('SecaoAlcancada').length,0);
  for(const id of ['mapa','amostra','objecoes','oferta','mapa','amostra','objecoes','oferta'])await rolar(f.p,await topo(f.p,id));
  await f.p.evaluate(()=>{const desligar=window.__T14__.reiniciar();desligar();window.__T14__.reiniciar();window.__T14__.responderConsentimento(true);});await quadro(f.p);
  assert.equal(f.eventos('PageView').length,1);assert.equal(f.eventos('ViewContent').length,1);
  for(const [id,etapa] of [['mapa',4],['amostra',6],['objecoes',9]]){
   const e=f.eventos('SecaoAlcancada').filter(a=>a[2].secao===id);assert.equal(e.length,1,id);
   assert.deepEqual(e[0][2],{secao:id,etapa,canonico:true,campanha:'cmp-2026-10-teto-natural'});
  }
  assert.equal(f.estado.scripts,1);assert.equal(f.eventos('Purchase').length,0);return f.estado;
 }));

 await testar('T14-EVENTOS-limiar','integracao',['RF-L31'],'SecaoAlcancada só após topo cruzar60% janela; repetição não duplica',()=>comPagina(fixtureQuery(),{resposta:true},async f=>{
  const rootBounds=await f.p.evaluate(()=>new Promise(resolve=>{const io=new IntersectionObserver(([e])=>{const r=e.rootBounds;resolve({top:r.top,bottom:r.bottom,width:r.width,height:r.height,viewport:{width:innerWidth,height:innerHeight}});io.disconnect();},{rootMargin:'-1px 0px -40% 0px',threshold:0});io.observe(document.getElementById('mapa'));}));
  const y=await topo(f.p,'mapa');
  await rolar(f.p,y-0.6*640-4);assert.equal(f.eventos('SecaoAlcancada').filter(a=>a[2].secao==='mapa').length,0);
  await rolar(f.p,y-0.6*640+4);await f.p.waitForFunction(()=>window.fbq.queue.length===0);await quadro(f.p);
  assert.equal(f.eventos('SecaoAlcancada').filter(a=>a[2].secao==='mapa').length,1);
  await rolar(f.p,y-0.6*640-4);await rolar(f.p,y-0.6*640+4);
  assert.equal(f.eventos('SecaoAlcancada').filter(a=>a[2].secao==='mapa').length,1);return {rootBounds,...f.estado};
 }));

 await testar('T14-UTM-cliques','integracao',['RF-L26','RF-L28','RF-L29','RF-L30'],'UTM preservada, base protegida, dois cliques legítimos e zeroPurchase',()=>comPagina(fixtureQuery({query:{utm_source:'meta',utm_medium:'visitante',utm_campaign:'campanha',utm_content:'criativo',estranho:'nao-repassar'}}),{resposta:true},async f=>{
  await f.p.waitForFunction(()=>!!window.fbq?.callMethod);await quadro(f.p);
  const href=await f.p.locator('a[data-posicao=fixture]').getAttribute('href'),u=new URL(href);
  assert.equal(u.searchParams.get('utm_source'),'meta');assert.equal(u.searchParams.get('utm_medium'),'base');assert.equal(u.searchParams.get('sck'),'criativo');assert.equal(u.searchParams.get('estranho'),null);assert.equal(u.hash,'#pagar');
  await f.p.evaluate(()=>{history.replaceState(null,'','#ancora');window.__cancelarDestino=e=>{if(e.target.closest('a[data-posicao]'))e.preventDefault();};document.addEventListener('click',window.__cancelarDestino);});
  await f.p.locator('a[data-posicao=fixture]').click();await f.p.locator('a[data-posicao=fixture]').click();await quadro(f.p);
  assert.equal(f.eventos('InitiateCheckout').length,2);
  for(const e of f.eventos('InitiateCheckout'))assert.deepEqual(e[2],{posicaoCTA:'fixture',campanha:'cmp-2026-10-teto-natural'});
  assert.equal(await f.p.locator('a[data-posicao=fixture]').getAttribute('href'),href);
  await f.p.evaluate(()=>{document.removeEventListener('click',window.__cancelarDestino);window.__trackerFalha=true;});
  await f.p.locator('a[data-posicao=fixture]').click();assert.equal(f.estado.checkouts.length,1);assert.equal(f.eventos('Purchase').length,0);
  return {href,...f.estado};
 }));

 for(const n of [0,1,3])await testar('T14-CARROSSEL-'+n,'integracao',['tarefa07','tarefa14'],'partição de relatos'+n,()=>comPagina(fixtureQuery({relatos:n}),{},async f=>{
  assert.equal(await f.p.locator('#prova-social').count(),n===0?0:1);
  if(n===0)return {relatos:0};
  assert.equal(await f.p.locator('#prova-social li').count(),n);
  assert.equal(await f.p.locator('#prova-social button').count(),n>1?2:0);
  assert.equal(await f.p.locator('#prova-social [role=region]').count(),n>1?1:0);
  if(n>1){
   // Rótulos vêm da copy real; o cenário abaixo usa os rótulos DOM para teclado.
   const botoes=f.p.locator('#prova-social button');await botoes.nth(1).focus();
   await f.p.keyboard.press('Enter');await f.p.waitForFunction(()=>document.querySelector('#prova-social [aria-live]').textContent.includes('2 de 3'));
   await f.p.keyboard.press('Enter');await f.p.waitForFunction(()=>document.querySelector('#prova-social [aria-live]').textContent.includes('3 de 3'));
   await quadro(f.p); // useEffect que transfere foco vem depois do commit do índice
   const foco=await f.p.evaluate(()=>({ativo:{tag:document.activeElement.tagName,label:document.activeElement.getAttribute('aria-label')},botoes:[...document.querySelectorAll('#prova-social button')].map(b=>({label:b.getAttribute('aria-label'),disabled:b.disabled,focado:b===document.activeElement}))}));
   await writeFile(path.join(pasta,'carrossel-foco.json'),JSON.stringify(foco,null,2));
   assert.equal(await botoes.nth(1).isDisabled(),true);assert.equal(await botoes.nth(0).evaluate(e=>e===document.activeElement),true,'foco após desabilitar último: '+JSON.stringify(foco));
   await f.p.keyboard.press('Enter');await f.p.waitForFunction(()=>document.querySelector('#prova-social [aria-live]').textContent.includes('2 de 3'));
   const regiao=f.p.locator('#prova-social [role=region]');await regiao.focus();const x=await regiao.evaluate(e=>e.scrollLeft);
   await f.p.keyboard.press('ArrowRight');await f.p.waitForFunction(x=>document.querySelector('#prova-social [role=region]').scrollLeft>x,x);
  }
  assert.deepEqual(f.estado.erros,[]);return {relatos:n,erros:f.estado.erros};
 }));

 await testar('T14-CARROSSEL-toque','integracao',['tarefa07','tarefa14'],'swipe nativo horizontal e gesto vertical seguem livres',()=>comPagina(fixtureQuery(),{},async f=>{
  const regiao=f.p.locator('#prova-social [role=region]');await regiao.scrollIntoViewIfNeeded();const box=await regiao.boundingBox();
  const cdp=await f.ctx.newCDPSession(f.p);
  async function gesto(dx,dy){const x=box.x+box.width*0.7,y=box.y+Math.min(box.height/2,100);
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
   for(let i=1;i<=12;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx*i/12,y:y+dy*i/12}]});
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  }
  await gesto(-190,0);await f.p.waitForFunction(()=>document.querySelector('#prova-social [role=region]').scrollLeft>20);
  const horizontal=await regiao.evaluate(e=>e.scrollLeft),antes=await f.p.evaluate(()=>scrollY);
  await gesto(0,-150);await f.p.waitForFunction(y=>scrollY>y+20,antes);
  const depois=await f.p.evaluate(()=>scrollY);assert(depois>antes+20);return {horizontal,antes,depois};
 }));

 await testar('T14-CARROSSEL-teclado','integracao',['tarefa07','RNF-L11'],'setas nativas e botão anterior navegam entre relatos',()=>comPagina(fixtureQuery(),{},async f=>{
  const regiao=f.p.locator('#prova-social [role=region]');await regiao.focus();
  await f.p.keyboard.press('ArrowRight');await f.p.waitForFunction(()=>document.querySelector('#prova-social [role=region]').scrollLeft>20);
  const direita=await regiao.evaluate(e=>e.scrollLeft);
  await f.p.keyboard.press('ArrowLeft');await f.p.waitForFunction(x=>document.querySelector('#prova-social [role=region]').scrollLeft<x,direita);
  const botoes=f.p.locator('#prova-social button');await botoes.nth(1).focus();await f.p.keyboard.press('Enter');
  await f.p.waitForFunction(()=>document.querySelector('#prova-social [aria-live]').textContent.includes('2 de 3'));
  await botoes.nth(0).focus();await f.p.keyboard.press('Enter');
  await f.p.waitForFunction(()=>document.querySelector('#prova-social [aria-live]').textContent.includes('1 de 3'));
  return {direita,indice:'1 de 3'};
 }));

 await testar('T14-FAQ','integracao',['RF-L11','tarefa08'],'três respostas inicialmente expostas; toggle teclado restaura resposta',()=>comPagina(fixtureQuery(),{},async f=>{
  const details=f.p.locator('#faq details');assert.equal(await details.count(),3);
  for(let i=0;i<3;i++){
   const item=details.nth(i),summary=item.locator('summary');assert.equal(await item.getAttribute('open'),'');assert(await item.locator('p').isVisible());
   await summary.focus();await f.p.keyboard.press('Enter');await f.p.waitForFunction(i=>!document.querySelectorAll('#faq details')[i].open,i);assert.equal(await item.locator('p').isVisible(),false);
   await f.p.keyboard.press('Enter');await f.p.waitForFunction(i=>document.querySelectorAll('#faq details')[i].open,i);assert(await item.locator('p').isVisible());
  }
  return {respostas:3};
 }));

 await testar('T14-COMPONENTES-nojs','integracao',['RNF-L16','RF-L11','tarefa07'],'carrossel nativo e três respostas legíveis sem JS; controles mortos ocultos',()=>comPagina(fixtureQuery(),{js:false},async f=>{
  assert.equal(await f.p.locator('#prova-social li').count(),3);
  for(const b of await f.p.locator('#prova-social button').all())assert.equal(await b.isVisible(),false);
  assert.equal(await f.p.locator('#faq details[open]').count(),3);
  for(const p of await f.p.locator('#faq details p').all())assert(await p.isVisible());
  assert.equal(await f.p.locator('html').getAttribute('class'),null);return {relatos:3,respostas:3,controlesVisiveis:0};
 }));

 for(const [nome,clock,estado,cta] of [['vigente',agora,'vigente',1],['expirada',fim,'encerrada',0],['fronteira-inicio',inicio,'vigente',1],['antes-inicio',inicio-1,'agendada',0]])await testar('T14-OFERTA-'+nome,'integracao',['tarefa09','tarefa14'],'condição eCTA: '+nome,()=>comPagina(fixtureQuery({condicao:'datada',base:false}),{clock},async f=>{
  assert.equal(await f.p.locator('[data-condicao-oferta]').getAttribute('data-estado'),estado);
  assert.equal(await f.p.locator('a[data-posicao=fixture]').count(),cta);
  assert.deepEqual(f.estado.erros,[]);return {clock,estado,cta};
 }));

 await testar('T14-OFERTA-ausente','integracao',['tarefa09'],'condição ausente não renderiza urgência nem libera oferta-base indisponível',()=>comPagina(fixtureQuery({base:false}),{},async f=>{
  assert.equal(await f.p.locator('[data-condicao-oferta]').count(),0);assert.equal(await f.p.locator('a[data-posicao=fixture]').count(),0);return {condicao:0,cta:0};
 }));
 await testar('T14-OFERTA-clique-fim','integracao',['tarefa09','RF-L29'],'clique no instante fim é barrado mesmo comCTA ainda presente',()=>comPagina(fixtureQuery({condicao:'datada',base:false}),{resposta:true},async f=>{
  assert.equal(await f.p.locator('a[data-posicao=fixture]').count(),1);
  await f.p.locator('a[data-posicao=fixture]').evaluate((el,fim)=>{window.__T14_NOW__=fim;el.click();},fim);await quadro(f.p);
  assert.equal(f.estado.checkouts.length,0);assert.equal(f.eventos('InitiateCheckout').length,0);assert.equal(await f.p.locator('a[data-posicao=fixture]').count(),0);
  return f.estado;
 }));
 await testar('T14-OFERTA-nojs','integracao',['RNF-L16','tarefa09'],'SSR semJS é neutro/datado e não promete disponibilidade temporária',()=>comPagina(fixtureQuery({condicao:'datada',base:false}),{js:false,clock:fim},async f=>{
  assert.equal(await f.p.locator('[data-condicao-oferta]').getAttribute('data-estado'),'neutra');
  assert.equal(await f.p.locator('a[data-posicao=fixture]').count(),0);
  assert.equal(await f.p.locator('time').count(),2);assert((await f.p.locator('[data-condicao-oferta]').innerText()).includes('Ticto confirma'));
  assert.equal(f.estado.scripts,0);return {estado:'neutra',datas:2,cta:0};
 }));

 if(process.env.FIXTURE_ONLY!=='1'){
  for(const [w,h] of [[360,560],[360,640],[390,700],[412,780]]){
   for(const resposta of [null,false])for(const posicao of ['dobra','fechamento'])await testar(`T14-CTA-${w}x${h}-${resposta===null?'cookies':'recusa'}-${posicao}`,'e2e',['RF-L09','RF-L10','RNF-L23'],'CTA painel integralmente visível e semoclusão',()=>comPagina(alvo,{viewport:{width:w,height:h},resposta},async f=>{
    // A apresentação tem introdução: aguardar seu estado final observável.
    await f.p.waitForFunction(()=>{const i=document.querySelector('.intro');return !i||i.inert||getComputedStyle(i).display==='none'||getComputedStyle(i).visibility==='hidden'||parseFloat(getComputedStyle(i).opacity)<0.01;});
    const id=posicao==='dobra'?'inicio':'fechamento';await rolar(f.p,await topo(f.p,id));
    const r=await f.p.locator(`a[data-posicao=${posicao}]`).evaluate(el=>{
     const b=el.getBoundingClientRect(),s=el.closest('section').getBoundingClientRect(),aviso=document.querySelector('[aria-label="Aviso de cookies"]')?.getBoundingClientRect();
     const amostras=[[b.left+3,b.top+3],[(b.left+b.right)/2,(b.top+b.bottom)/2],[b.right-3,b.bottom-3]].map(([x,y])=>({x,y,alvo:el.contains(document.elementFromPoint(x,y))}));
     const rolo=el.querySelector('.botao__rolo'),rotulo=rolo.firstElementChild;
     return {viewport:{width:innerWidth,height:innerHeight},botao:{top:b.top,bottom:b.bottom,left:b.left,right:b.right,width:b.width,height:b.height},painel:{top:s.top,height:s.height},aviso:aviso?{top:aviso.top,bottom:aviso.bottom}:null,amostras,rotulo:{altura:rotulo.getBoundingClientRect().height,recorte:rolo.getBoundingClientRect().height},doca:document.querySelector('.doca')?.hasAttribute('data-ativa'),erros:[]};
    });
    await f.p.screenshot({path:path.join(pasta,`cta-${w}x${h}-${resposta===null?'cookies':'recusa'}-${posicao}.png`)});
    await writeFile(path.join(pasta,`cta-${w}x${h}-${resposta===null?'cookies':'recusa'}-${posicao}.json`),JSON.stringify(r,null,2));
    assert(r.botao.top>=0&&r.botao.bottom<h&&r.botao.left>=0&&r.botao.right<=w,JSON.stringify(r));
    assert(r.amostras.every(a=>a.alvo),'CTA ocluído: '+JSON.stringify(r));assert.equal(r.doca,false);assert.deepEqual(f.estado.erros,[]);assert.equal(f.estado.scripts,0);
    return r;
   }));
  }
  await testar('T14-E2E-hidratacao','e2e',['RNF-L16','RNF-L35','RF-L29'],'preview hidrata semerros; configuração atual não enviaPixel',()=>comPagina(alvo,{resposta:true},async f=>{
   for(const id of ['mapa','oferta','objecoes','fechamento'])await rolar(f.p,await topo(f.p,id));
   assert.deepEqual(f.estado.erros,[]);assert.equal(f.estado.scripts,0);assert.equal(f.estado.fbq.length,0);
   return f.estado;
  }));
  await testar('T14-E2E-falha-chunk','e2e',['RNF-L16','RNF-L35','tarefa14'],'falha real do chunk de coreografias preserva toda a copy',()=>comPagina(alvo,{resposta:false,chunkFail:true},async f=>{
   await f.p.waitForFunction(()=>document.documentElement.classList.contains('movimento-falhou'),null,{timeout:5000});
   assert(f.estado.chunksAbortados.length>0,'chunk não foi interceptado');
   const r=await f.p.evaluate(()=>({texto:document.body.innerText.length,escondidos:[...document.querySelectorAll('[data-revelar]')].filter(e=>parseFloat(getComputedStyle(e).opacity)<0.99).map(e=>e.tagName+'.'+e.className),ctas:document.querySelectorAll('a.botao').length}));
   assert(r.texto>2000);assert.deepEqual(r.escondidos,[]);assert(r.ctas>=3);return {r,...f.estado};
  }));
 }
} catch(e) {
 console.error(e.stack);resultados.push({id:'T14-AMBIENTE',nivel:'integracao',requisitos:['tarefa14'],descricao:'preparação/execução runner',estado:'falhou',inicio:new Date().toISOString(),duracao_ms:0,tentativas:1,observado:String(e.stack)});
} finally {
 await browser?.close();await servidor?.close();
 const falhas=resultados.filter(r=>r.estado==='falhou');
 const relatorio={inicio:inicioExecucao,fim:new Date().toISOString(),alvo,fixture:fixtureUrl??null,comando:`CHROMIUM=${process.env.CHROMIUM??'<browser padrão>'} node scripts/verificar-conversao.mjs ${alvo}`,isolamento:'Vite SSR e módulos reais; config/relógio/saída fbq/checkout sintéticos; toda rede externa interceptada; sem RF-L27 ou Purchase real',resultados,total:resultados.length,passaram:resultados.length-falhas.length,falharam:falhas.length,consoles,codigo_saida:falhas.length?1:0};
 await writeFile(path.join(pasta,process.env.FIXTURE_ONLY==='1'?'fixture-resultado.json':'resultado.json'),JSON.stringify(relatorio,null,2));
 console.log(`TOTAL ${relatorio.total}: ${relatorio.passaram} passaram; ${relatorio.falharam} falharam. Artefatos: ${pasta}`);
 process.exitCode=relatorio.codigo_saida;
}
