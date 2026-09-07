# fluor-landing

Landing page do **Projeto Flúor**. Ângulo `teto-natural`, protocolo de hipertrofia.

A especificação vive na base de documentação, não aqui:
`~/Documentos/projetos/02-fluor/landing/requisitos-landing.md` (série `RF-L`/`RNF-L`).
Este repositório é a implementação dela. Em divergência, **o documento vence**.

## Por que fora da base

A base de documentação trava a profundidade em 3 níveis dentro de cada raiz, e
`02-fluor/landing/site/src/sections/Hero.jsx` seria 4. Além disso o
`.design-sync/NOTES.md` registra que não há código vivo nas três raízes. Então o
código mora aqui, ao lado, e a ponte entre os dois é o `ds-bundle`.

## Começar

```bash
npm install
npm run sync:ds     # traz tokens e fontes do ds-bundle
npm run dev
```

Se a base estiver em outro caminho:

```bash
DS_BUNDLE=/caminho/para/.design-sync/ds-bundle npm run sync:ds
```

## Comandos

| Comando | O que faz |
| --- | --- |
| `npm run sync:ds` | copia tokens e fontes do `ds-bundle` e gera o wordmark em SVG |
| `npm run dev` | servidor de desenvolvimento |
| `npm run build` | sync, build do cliente, build SSR, pré-renderização e conferência de orçamento |
| `npm run verificar` | contraste, foco, zoom, movimento reduzido, CLS, leitura sem JS, manifesto, odômetro, prova, doca e introdução, nos dois temas |

O `verificar` precisa de um Chromium. Sem um no cache do Playwright:
`npx playwright-core install chromium`, ou `CHROMIUM=/caminho npm run verificar`.

## A página, seção a seção

A ordem é a sequência canônica do `RF-L08`. O que a versão 6 (06/09/2026) mudou foi a
**forma** de cada seção: a v5 vestia todas com a mesma caixa, e três delas com o mesmo
capítulo travado, e a página lia como um componente repetido nove vezes. Agora cada
seção é um desenho próprio, tirado das cinco engenharias reversas em
`02-fluor/reversos/`:

| # | Seção | Tema | Desenho | De onde vem |
| --- | --- | --- | --- | --- |
| 01 | `Dobra` | Sigilo | headline de duas linhas, a segunda em contorno, encostando nas bordas | Rep Republic (tipografia como arquitetura) |
| 02 | `Manifesto` | Sigilo | texto grudado no meio da tela, palavra a palavra, ligado à rolagem | Nakula |
| — | `Marquise` | Sigilo | faixa em laço, uma só, onde a energia cai | Gaspar |
| 03 | `Espelho` | Cartaz | baralho de cinco cards que grudam e se acumulam; o hoje riscado como metadado, lastro no lugar das estrelas, botão em contorno por card | Rep Republic ("Find Your Program"), conteúdo do Kora |
| 04 | `Leva` | Sigilo, cards alternando Cartaz | cabeça centrada e grudada no meio da tela, seis cards passando por cima em ziguezague, sobre o campo de pontos; a fala é o benefício, o nome é o termo-marca | Rep Republic ("Members' Words") |
| 05 | `Semanas` | Sigilo | fio vertical, título em três linhas e tese deslocada à direita; régua de 12 e cinco cards em ziguezague com capa, nome e legenda | lenis.dev ("runs the web") |
| 06 | `Prova` | Sigilo | bloco pinado sobre campo de pontos animado, statement acendendo palavra a palavra com a corrente em acento; depois a régua e o intervalo | Google Cloud × Team USA (fecho) |
| 07 | `Oferta` | Cartaz | recibo com serrilha, marcadores em colchetes e preço fatiado | Nakula e Kora |
| 08 | `Garantia` | Cartaz | selo carimbado, levemente fora do eixo, cruz de registro | mestre visual §7 |
| 09 | `Objecoes` | Sigilo | diálogo: objeção à direita com aspas gigantes, resposta à esquerda | Nakula (aspas) |
| 10 | `Fechamento` | Sigilo | segunda capa: a headline espelhada e a marquise do verbo sobre o botão | Rep Republic e Gaspar ("Next") |
| 11 | `RodapeLegal` | Sigilo, faixa em acento | quatro colunas com e-mail no acento, seções e documentos com seta, aviso com botão em contorno; copyright; faixa inteira em Rubro com o wordmark gigante e a tagline | Nakula |

Mais a **doca** (`Doca.jsx`): barra fixa na base com preço, Pix e o botão, que entra quando
a dobra sai da tela e sai quando o fechamento entra. Sem JavaScript ela não existe, e
isso é regra, não falta: em CSS puro ela comeria 56px da primeira tela.

O botão aparece seis vezes mais a doca, sempre com o mesmo verbo (`RF-L10`), nunca duas
vezes na mesma tela. O rótulo faz text roll no hover, que é a convenção dos cinco sites.

## O que o build faz de diferente

**Pré-renderiza.** Uma SPA React entrega uma `div` vazia sem JavaScript, o que reprova
o `RNF-L16` e atrasa o LCP. O build roda um segundo passe SSR e injeta o HTML em
`index.html`; o cliente só hidrata. Os pedaços preguiçosos entram em `modulepreload`.

**Mede o orçamento.** `scripts/check-size.mjs` falha o build no dia em que o JavaScript
comprimido passar de 120 KB (`RNF-L04`) ou as fontes de 130 KB (`RNF-L05`). Hoje: 99,6 KB
de JavaScript, com React, anime.js, Lenis e a página inteira dentro; 79,2 KB de fonte.

## Rolagem

**Lenis**, com os defaults do estúdio que o escreveu: `lerp 0.1`, `anchors: true`,
`autoRaf: true`. Não invente valores; foram calibrados em milhões de sessões.

Três coisas que importam sobre como ele foi ligado:

- **O toque é nativo.** `syncTouch` fica em `false`, então no celular a rolagem é a do
  sistema, com o momentum do próprio iOS e Android. O Lenis só assume roda e trackpad.
  É onde o tráfego chega, e nada é sequestrado.
- **A janela rola de verdade.** A biblioteca usa `window.scrollTo`, então `position:
  sticky`, `IntersectionObserver` e o `onScroll` do anime.js continuam lendo a rolagem
  nativa. Nada precisou ser adaptado.
- **Movimento reduzido é da própria biblioteca.** `respectReducedMotion` força o `lerp`
  para 1 e mantém a instância viva. Não desligue o Lenis para isso.

O `html` **não** tem `scroll-behavior: smooth`: os dois juntos fariam o navegador
suavizar por cima do lerp. E toda conferência manual passa `behavior: "instant"` no
`scrollTo`, porque leitura imediata depois de um scroll suavizado devolve a posição velha.

Ele expõe a velocidade em `--scroll-velocity`, que a marquise consome em CSS para
inclinar com a rolagem.

## A introdução

A cortina do lenis.dev, lida do CSS de produção do site (`intro-module`): cortina fixa na
cor da marca, letras nascendo abaixo da própria linha (`translateY(100% + índice * 5%)`) e
subindo uma a uma em 1,5 s expo-out com 75 ms por índice; aos 1,5 s a cortina sobe
(`translateY(-100%)`) e o bloco de letras sobe quase duas vezes mais rápido que ela, com o
herói já composto por baixo. Aqui a cortina é o Rubro e as letras são a headline da dobra
em tinta, na mesma escala, no mesmo envelope (`Intro.jsx`).

Três decisões, e cada uma tem um motivo medido:

- **Em toda carga**, inclusive recarga no meio da página (decisão do gerente do projeto).
  A cortina é fixa, então cobre a tela em qualquer posição de rolagem.
- **Decidida antes da primeira pintura.** O script inline do `index.html` escreve
  `intro-pendente` no `html` antes de qualquer CSS aplicar, senão a cortina pisca por
  cima do herói pré-renderizado. Sem JavaScript e sob movimento reduzido ela não existe.
- **O herói compõe debaixo da cortina**, e já está parado quando ela levanta, como no
  site de origem. Compor depois empurrava o LCP local de 1,1 s para 2,4 s: o que está
  coberto continua contando como pintado, e o que está em `opacity: 0` não.

`pointer-events: none` e `aria-hidden`: é imagem, não interface. O `verificar` cobre a
entrada, a saída em menos de 4 s, a presença na recarga e a ausência sob movimento reduzido
(`INT-01`).

## Movimento

Dois vocabulários, e a regra que os separa: **revelação de marca corta em `steps()`;
movimento de layout é contínuo em expo-out**, a mesma curva do Lenis. Se tudo cortasse,
o corte deixaria de significar.

Quem anima é o anime.js; quem dispara a revelação é `IntersectionObserver` nativo. O
`onScroll` da biblioteca só aparece em movimento **ligado** à rolagem: parallax, as
palavras do manifesto e o odômetro das semanas. Como gatilho de revelação ele deixou 14
de 30 elementos invisíveis em 05/09/2026. Há uma rede de segurança em
`garantirVisibilidade()`: qualquer `[data-revelar]` que continue invisível dentro da
viewport depois de 2,5 s volta a aparecer.

Armadilhas pagas com defeito medido, todas ainda válidas:

- **O gatilho por observador desconta 80px do rodapé da janela.** O que já está na tela
  quando o JavaScript acorda e mora nesses 80px (o rodapé da dobra) nunca é revelado
  pela rolagem. Por isso `revelar()` tem `imediato`, e `abrirPainel()` o usa na dobra.
- **A varredura de resgate cobre o que já passou, não só o que está na tela.** Em rolagem
  rápida o observador perde o disparo, e o elemento nunca mais volta a intersectar: sem
  isso ele só aparecia 2,5 s depois, pela rede de segurança.
- **A duração da subida é por contexto, não global.** O padrão de `subirLinhas` (820 ms com
  110 ms de escalonamento) é o da dobra, onde a headline abre a página junto da cortina. No
  meio da página o visitante já está olhando para o título, e a mesma duração lê como demora:
  a seção das doze semanas passa 520 ms com 60 ms, fechando em ~640 ms, dentro do teto de
  0,8 s que as engenharias reversas fixam para interação direta.
- **`overflow: clip` na linha corta os dois eixos.** Com entrelinha abaixo de 1, o acento sai
  da caixa e some. `.linha` tem folga em cima e embaixo, e cada uma tem motivo próprio.
- **Título com `data-revelar` cujas linhas animam por dentro** precisa sair do
  `opacity: 0` na mão (`utils.set(titulo, { opacity: 1 })`), senão as linhas sobem
  dentro de um pai invisível.
- **Espaço no fim de um `inline-block` é descartado.** As palavras do manifesto colavam;
  o espaço fica fora do `span`.
- **Parallax move conteúdo dentro de um recorte, nunca o recorte**, com teto de 72px, e
  o limiar do `onScroll` se lê "borda da janela, borda do alvo": escrito ao contrário o
  fim cai antes do começo e a biblioteca zera a distância sem avisar.
- **A marquise repete o conteúdo até cobrir a janela**: uma metade precisa ser mais
  larga que a tela, senão um vão corre junto com o texto.
- **`overflow: clip`, nunca `hidden`**, em qualquer ancestral de algo grudado (`RNF-L37`).
- **Painel com filho absoluto usa flex, não grid.**
- **`100svh`, nunca `100vh`** nos painéis de tela cheia.

**O odômetro** (`Semanas.jsx`): a seção é o trilho e mede; o painel gruda no alto e
exibe. `percorrer()` divide a travessia em 12 degraus, e cada degrau troca o número, o
estado e a régua por corte. Existem cinco estados, não doze, e todos saem do capítulo do
programa do draft. Sem JavaScript e sob movimento reduzido o painel não gruda e os cinco
aparecem empilhados.

**As palavras** (`Manifesto.jsx`): `acenderPalavras()` acende uma por vez conforme a
seção passa, e apaga na volta. Completam a 74% da travessia, para o texto estar inteiro
antes de a seção ir embora. Apagada é opacidade, não cor: é a convenção da página para
revelação pendente, e é o que o `verificar` sabe descontar.

## O campo de pontos

Ao fundo da **prova**, do **que se leva** e das **três perguntas** (`CampoDePontos.jsx`).
Nunca dois animando ao mesmo tempo: cada um para o laço quando a sua seção sai da tela.

Duas variantes:

- **`malha`** (prova, o que se leva): grade regular com deslocamento senoidal. Barata e
  discreta.
- **`fiel`** (as três perguntas): a rede em perspectiva, que é a leitura mais próxima do site
  de origem. **A lição que custou duas tentativas:** naquele site os pontos não são
  aleatórios. Nas áreas calmas aparece uma rede regular, e o adensamento só acontece nas
  cristas; randomizar destrói justamente o que torna a crista legível. Então é uma malha
  regular deformada por um relevo e projetada: perto espalha e brilha, longe junta e apaga.
  Medida em 16,7 ms de quadro nos dois formatos.

**Ele esbarra no `TR-03`**, um dos 16 testes de rejeição, que reprova peça com "faísca ou
partícula". A decisão está em aberto no contrato (§6). Por isso ele é feito só do material do
sistema (ponto de 1 bit, fio de grade, zero brilho, zero gradiente, zero cor própria) e vive
isolado: reprovado o teste, troque o componente por `null` em `Prova.jsx` e o layout continua
de pé, só o fundo fica liso.

Três travas de custo, e nenhuma é opcional:

- **Só anima na tela.** `IntersectionObserver` para o laço quando a seção sai.
- **Movimento reduzido desenha um quadro e para.** É ornamento: não informa nada.
- **Densidade por área, com teto de pontos por quadro.** Num monitor grande a malha não pode
  multiplicar o trabalho de cada quadro.

E uma trava de leitura: a nota honesta tem superfície opaca por cima do campo, porque o
`TR-07` proíbe texto corrido sobre imagem sem scrim ou moldura por baixo.

## Tema

A página **compõe** os dois modos em vez de escolher um: blocos Sigilo e blocos Cartaz
alternados, com a troca no limite da seção, em corte. Não segue `prefers-color-scheme`,
e isso é deliberado (`RNF-L19`).

Há uma correção de token no topo de `pagina.css`: o `ds-bundle` declara
`--acento: var(--rubro)` em `:root` e não re-aliasa no bloco Cartaz. A correção de
verdade é na fundação; a linha daqui sai quando ela chegar.

## Escala

Uma família assina, anuncia e rotula (Secundária); a Terciária explica. A escala
canônica vive em classes, e no desktop cada papel sobe um degrau (`titulo` para
`display`, corpo para 18px, marquise e diálogo para a medida do `h2`).

`display-xxl` é a exceção declarada: `clamp(72px, 27vw, 200px)`, em **três** lugares
só (as duas headlines de painel e o número da semana). Não é tamanho de texto, é
tipografia como arquitetura, e aparecer pouco é o que mantém a escala como assinatura.

## O que não entra aqui

Roteador (uma página só), framework de CSS utilitário (traz escala e paleta próprias),
biblioteca de componentes (raio 0 e zero sombra não são o padrão de nenhuma),
gerenciador de estado, backend, segunda biblioteca de animação ou de rolagem, e CDN em
tempo de execução.

## Antes de publicar

O `npm run verificar` cobre o que dá para medir. O que sobra é olho, e não é opcional:
os 16 testes de rejeição de `extracao-pontos-negativos.md` §8 e os campos
`[A DEFINIR]` de `src/config.js`: preço, prazo de garantia, URL da Ticto, id do pixel e
o parâmetro de rastreio. Sem eles a página não vende.
