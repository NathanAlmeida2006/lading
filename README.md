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
| `npm run sync:ds` | copia tokens e fontes do `ds-bundle`, gera o subset da Marca e o wordmark em SVG |
| `npm run dev` | servidor de desenvolvimento |
| `npm run build` | sync, build do cliente, build SSR, pré-renderização e conferência de orçamento |
| `npm run verificar` | dez verificações: contraste, foco, zoom, movimento reduzido, CLS, LCP, elementos presos e leitura sem JS |

## O que o build faz de diferente

**Pré-renderiza.** `RNF-L16` exige que a página seja legível até o fim sem
JavaScript, e uma SPA React entrega uma `div` vazia. O build roda um segundo
passe SSR e injeta o HTML dentro de `index.html`; o cliente só hidrata. Sobra
também LCP mais baixo, que é o `RNF-L01`.

**Confere orçamento.** `scripts/check-size.mjs` falha o build se o JavaScript
comprimido passar de 120 KB (`RNF-L04`) ou as fontes de 130 KB (`RNF-L05`).
Hoje: **93,1 KB** de JS e **79,2 KB** de fonte.

**Gera o wordmark.** `scripts/wordmark.py` converte `LITHIUM` em contornos a partir da
Big Shoulders Display, porque `RF-G04` proíbe texto vivo na assinatura. Precisa de `python3` e
`fonttools[woff]`; sem eles o sync avisa e degrada para texto vivo.

## Fontes da verdade

Nada de cor, tamanho, espaço ou duração é escrito neste repositório. Tudo
referencia token de `src/styles/tokens/`, que é cópia do `ds-bundle`, que é
tradução do mestre visual. Divergiu? **Corrige na base e roda o sync**, nunca
aqui - `src/styles/tokens/` está no `.gitignore` exatamente para que ninguém
tente.

`src/motion/tokens.js` lê as durações do CSS em tempo de execução, pelo mesmo
motivo: repetir `180ms` em JavaScript criaria a segunda fonte da verdade que o
`RNF-G16` proíbe, e ela envelheceria em silêncio.

## Tipografia

**Duas famílias:** a Secundária (Big Shoulders Display) assina, anuncia e rotula; a
Terciária (IBM Plex Sans) explica. `RF-G05` admite até três, e usar duas é escolha, não
falta. `scripts/wordmark.py` gera o LITHIUM em contornos, porque `RF-G04` proíbe texto vivo
na assinatura.

Há um remapeamento declarado no topo de `pagina.css`: os tokens `display-xl` e `display`
são os únicos acima de 32px e apontam para a Principal de Suporte, que saiu da peça. A
**família** do token foi remapeada; tamanho, entrelinha e peso continuam sendo os do token.

## Desktop

Uma coluna até 1024px, **grade de 12 colunas daí para cima**. O envelope abre para 1120px,
e para 1440px em tela de 1440px. Abaixo de 1024px nada muda: a captura da página inteira a
390px é idêntica byte a byte antes e depois da grade entrar, e é assim que se confere.

A grade se aplica em **larguras alternadas**, não uniformemente. A maioria dos capítulos
parte em cabeça grudada (colunas 1 a 4) mais corpo (6 a 12); o catálogo de cartões rompe o
container e ocupa as 12. A alternância é o ritmo, e vem da [[engenharia-reserva]].

Três armadilhas pagas com defeito medido:

- **A cabeça de largura cheia usa `position: relative`, nunca `static`.** O número cru é
  `position: absolute; right: 0`, e sem bloco de contenção ele encosta na borda da JANELA em
  vez da do envelope, onde o `overflow: clip` da seção corta ele pela metade.
- **O número cru só cresce na cabeça partida.** Na cabeça de largura cheia a coluna é baixa,
  e o ornamento em 132px transborda por baixo dela e cai atrás dos cartões.
- **O respiro vertical não acompanha a largura.** `--space-9` no desktop é o que o
  `requisitos-landing.md` §3.1 fixa, e o documento vence.

## A pilha

Cada seção é `position: sticky` e a próxima sobe por cima. Vale nos dois breakpoints.

O problema difícil é **seção mais alta que a tela**, e ele se resolve no valor do `top`:

| | `top: 0` | `top: min(0px, 100svh − altura)` |
| --- | --- | --- |
| seção de uma tela | gruda pelo topo | idêntico (a conta dá 0) |
| seção de 2600px | congela os 1700px de baixo antes de alguém ler | rola inteira, gruda quando o **rodapé** dela alcança a base da tela |

A altura entra por `--altura`, escrita por `medirPilha()` com um `ResizeObserver`. Só a
altura: o `100svh` fica no CSS porque `window.innerHeight` encolhe e cresce com a barra do
navegador do celular, e o ponto de grude ficaria pulando a cada rolagem.

Cinco armadilhas, todas pagas com defeito medido:

- **`bottom: 0` parece mais curto e está errado.** O `bottom` prende nos **dois** sentidos:
  não só segura a seção que já passou como **puxa para cima** a que ainda não chegou. Como
  todas dividem o mesmo bloco de contenção, no carregamento as nove sobem de uma vez e a
  página abre no fechamento. Medido: `#reconhecimento` em `0..900` com a dobra por baixo.
- **`top: calc(100svh − 100%)` não substitui a medição.** Em `sticky` a porcentagem do `top`
  resolve contra o bloco de contenção, que aqui é o `<main>` inteiro, e não contra a altura
  do elemento. E envolver cada seção num invólucro justo devolve a porcentagem certa mas
  tira o curso: `sticky` só se move dentro do bloco de contenção.
- **`isolation: isolate` em cada camada.** Sem ela o `z-index: 3` de um cartão de fase do
  mapa sobe para o contexto da raiz e passa por cima das seções **seguintes**, que só têm
  `z-index: auto`.
- **Fio de 1px no topo de cada camada.** Entre temas o corte já se vê; entre duas camadas do
  mesmo tema (oferta coberta pela garantia, as duas em Cartaz) a costura fica invisível e o
  efeito lê como texto truncado. Elevação aqui é fio, porque sombra está proibida.
- **O índice fixo não pode usar `IntersectionObserver`.** Numa pilha toda seção já alcançada
  continua grudada e intersecta a faixa do meio para sempre: as nove respondem sim ao mesmo
  tempo e o contador trava em `09 / 09`. A pergunta certa é quem está **por cima**, e isso
  se lê da geometria.

Sem JavaScript não há `--altura`, e uma seção alta grudada pelo topo esconde o próprio
rodapé, que é o que o `RNF-L16` proíbe. Então **sem JavaScript não há pilha**: tudo depende
da classe `.js`, e a página volta a rolar direto, inteira e legível. Sob
`prefers-reduced-motion`, idem.

## O capítulo travado

Um capítulo (`Capitulo.jsx`) é uma pilha dentro da pilha, o mesmo padrão um nível abaixo:
`.capitulo__paineis` é o trilho, fica no fluxo e é quem **mede** o curso; cada `.painel-cap`
é `position: sticky` dentro dele e é quem **exibe**; e os painéis **acumulam**, um cobrindo
o anterior, até o fim do trilho. Três seções já são capítulos: `o-que-e` (3 painéis), `mapa`
(4) e `prova` (4).

Quatro armadilhas, todas pagas com defeito medido:

- **Colisão de custom property.** O `App.jsx` escreve `--altura` inline na seção - é o que
  `medirPilha()` mede para a pilha de nível superior. Custom property herda, então um painel
  sem nome próprio leria essa `--altura` da seção inteira que o contém, em vez do fallback
  `100svh` do CSS, e o `top: min(...)` congelaria cedo demais sem disparar o defeito de forma
  óbvia. Por isso o painel mede a própria altura em `--altura-painel`, um nome que nenhum
  ancestral escreve.
- **Painel mais alto que a tela.** `top: min(degrau, 100svh − --altura-painel)`, a mesma
  conta do `top` da pilha de seções um nível acima: sem o `min`, um painel mais alto que a
  viewport grudado pelo topo esconderia o próprio rodapé, que é o que o `RNF-L16` proíbe. E
  vive sob `.js`, pelo mesmo motivo do `.js .secao`: sem JavaScript não há `--altura-painel`,
  e o painel fica em fluxo normal (`static`), legível de cima a baixo.
- **A lista de seletores de grude ganhou uma entrada.** `.painel-cap` entrou em
  `SELETORES_GRUDE`, em `src/motion/index.js`: quem declarar `position: sticky` numa classe
  nova precisa citá-la ali, senão `empilharBlocos()` e `empilharSecoes()` escalam um
  ancestral que tem grude dentro e desgrudam os descendentes.
- **Sem JavaScript o capítulo tem que colapsar, não sobrar vão.** O `gap` longo e o `::after`
  que produzem o curso de grude só existem sob `.js`; a regra base é `gap: var(--space-6)` e
  sem `::after`. Medido sem JavaScript a 360×640 antes da correção: 1382px de vazio em
  `o-que-e`, 1728px em `mapa` e 1728px em `prova` - o trilho sobrava porque o grude que o
  justificava não existia mais.

E a armadilha de metodologia que mais economiza tempo de quem vier depois: `html {
scroll-behavior: smooth }` faz `window.scrollTo(0, y)` sem `behavior` **animar**, e uma
leitura imediata em seguida devolve a posição **velha**. Toda conferência manual desta base
passa `behavior: "instant"`, ou usa `page.mouse.wheel` numa rolagem real.

## Escala no desktop

De 1024px para cima cada papel sobe **um degrau da escala canônica**. Nenhum tamanho
inventado, nenhum sexto tamanho:

| papel | celular | desktop |
| --- | --- | --- |
| título de seção | `h1` 32px | `display` clamp(40, 4.5vw, 56) |
| título de cartão, pergunta de objeção | `h3` 20px | 24px, a medida do `h2` |
| corpo | `body` 16px | 18px, a medida do `body-lg` |
| marquise | `label` 15px | 24px, a medida do `h2` |

A caixa cresce junto: `--space-7` de respiro nos cartões, na oferta e na garantia. Letra
maior na mesma caixa não lê maior, lê apertada.

**Os valores estão escritos no `pagina.css`, e isso é dívida.** A escala canônica vive em
CLASSES no `tokens/tipografia.css`, não em custom properties: não existe um
`--tamanho-display` para referenciar, e CSS puro não sabe dizer "vira a classe de cima"
dentro de uma media query. A correção de verdade é no `00-fundacao/identidade-visual/`,
expondo a escala também como variáveis, e é o mesmo padrão da correção do `--acento`.

Consequência conhecida: `body` e `body-lg` passam a coincidir em 18px no desktop. Eram 2px
de hierarquia, e ela volta quando a escala tiver degrau próprio de desktop.

## Tema

A página **compõe** os dois modos em vez de escolher um: blocos Sigilo e blocos Cartaz
alternados, com a troca no limite da seção, em corte. Não segue `prefers-color-scheme`, e
isso é deliberado: o interruptor global jogaria tudo para o Cartaz e apagaria o ritmo,
porque as seções Sigilo usam o `:root` e não declaram tema.

Há uma correção de token no topo de `pagina.css`. O `ds-bundle` declara
`--acento: var(--rubro)` em `:root` e não re-aliasa no bloco Cartaz, então o acento desce
preso no vermelho do Sigilo. A correção de verdade é na fundação; a linha daqui sai quando
ela chegar.

## Movimento

Dois vocabulários, e a regra que os separa: **revelação de marca corta em `steps()`;
movimento de layout é contínuo em expo-out.** Se tudo cortasse, o corte deixaria de
significar.

Quem anima é o anime.js; quem dispara a revelação é `IntersectionObserver` nativo.

Essa divisão foi paga com um defeito: o `onScroll` do anime.js deixava 14 de 30
elementos parados em opacidade 0 ou 0,5 mesmo com rolagem lenta, porque uma
animação de vários alvos resolve o limiar contra um alvo só. Conteúdo invisível
é defeito pior do que ausência de animação. Há ainda uma rede de segurança em
`garantirVisibilidade()`: qualquer elemento que continue invisível dentro da
viewport depois de 2,5 s volta a aparecer.

Parallax tem três travas pagas com defeito medido: teto de 72px de deslocamento; **move
conteúdo dentro de um recorte, nunca o recorte** (deslocar uma faixa de layout abre vão
entre as seções vizinhas); e **a ordem dos limiares**. O limiar se lê "borda da janela,
borda do alvo", e escrito ao contrário (`enter: "top bottom"`, `leave: "bottom top"`) o fim
cai antes do começo, a biblioteca zera a distância sem avisar, e o que sobra não é parallax:
é um deslocamento **fixo** de 72px. Foi assim que o `parallaxe()` viveu até 05/09/2026, e
o sintoma era o número cru do catálogo parado atrás dos cartões.

**O mapa das 12 semanas** empilha os três cartões de fase, e eles **acumulam**: no fim da
seção os três estão na tela, com o nome de cada fase legível. Cinco travas, todas pagas com
defeito medido:

- **Quem gruda é o `<li>`, não uma camada dentro dele.** `sticky` só se move dentro do
  próprio bloco de contenção: com o grude numa camada interna, o curso acabava junto com o
  `<li>` e o cartão ia embora. Isso é substituição, não acúmulo.
- **O curso entre cartões é `gap`, nunca `margin-bottom`.** A trava do `sticky` é a caixa de
  **margem** dentro do bloco de contenção, então 594px de margem embaixo de cada cartão
  tiram 594px do curso de grude dele. O cartão 3 não chegava a grudar.
- **O curso do último cartão é um `::after`, não `padding-bottom`.** A trava é o **content
  box**, e padding não conta: com a lista terminando no rodapé do último cartão, o teto de
  grude dos três virava a posição de fluxo do terceiro (medido: `offsetTop` travando em
  1920px nos três). Um `::after` é item de flex e estica o content box de verdade.
- **Nada de `transform` em ancestral de quem gruda.** Um ancestral transformado deixa de ser
  transparente para o `sticky` dos descendentes, e **`scale(1)` conta**: a matriz identidade
  quebra igual. Foi o `empilharSecoes()` escalando o `.envelope` da seção que desgrudou os
  cartões. Por isso ele só escala onde não há nada grudado dentro, e recua apagando onde há.
- **`overflow: clip`, nunca `hidden`, em qualquer ancestral.** `hidden` cria container de
  rolagem e desliga `sticky` em todo descendente, sem erro nenhum.

E duas de composição, porque acúmulo que não se lê é só sobreposição: o degrau é
`--space-9` (96px), que deixa aparecer o marcador **e o nome** da fase coberta; e o
apagamento vai no **conteúdo** do cartão, nunca na caixa, senão o texto do cartão de baixo
atravessa o de cima.

**A marquise repete o conteúdo até cobrir a janela.** Uma metade precisa ser mais larga que
a tela, senão o deslocamento traz o fim dela para dentro do quadro antes de a outra entrar,
e o que corre junto com o texto é um vão. No celular nunca apareceu porque lá qualquer
metade já passava da tela; num monitor de 2560px, quatro palavras não passam. As cópias
levam `aria-hidden`, e a duração acompanha o comprimento para a velocidade não mudar.

E uma armadilha de API que custou caro: o limiar do `onScroll` se lê **"borda do container,
borda do alvo"**. `leave: "bottom top"` acontece antes do `enter` - intervalo degenerado,
nenhuma animação, nenhum aviso.

**Painéis de tela cheia** (dobra e fechamento) usam `100svh`, nunca `100vh`: `vh` mede a
viewport grande e o botão cai fora da tela quando a barra do navegador aparece. Em tela
baixa quem cede é a headline, que desce um degrau da escala canônica; o botão nunca cede.

E uma regra de layout que custou três tentativas: **painel com filho absoluto usa flex, não
grid.** Filho absoluto de um grid resolve o bloco de contenção pela área implícita dele, e
corrigir isso com `grid-row`/`grid-area` desalinha as colunas.

**A página inteira é uma pilha de seções** (05/09/2026). Cada seção gruda e a próxima sobe
por cima dela; detalhes na seção "A pilha" abaixo. Isso **substituiu o CSS Scroll Snap**, que
fazia o trabalho contrário: o snap assenta a rolagem em limites, e a pilha não tem limite
para assentar porque uma seção continua na tela enquanto a seguinte a cobre.

Sem rolagem suave inercial, de propósito: no celular ela piora o que o sistema já faz bem,
e é no celular que o tráfego chega.

Com `prefers-reduced-motion`, tudo degrada para opacidade.

## O que não entra aqui

Roteador (uma página só), framework de CSS utilitário (traz escala e paleta
próprias, que colidem com os tokens), biblioteca de componentes (raio 0 e zero
sombra não são o padrão de nenhuma), gerenciador de estado, backend, e CDN em
tempo de execução.

## Antes de publicar

O `npm run verificar` cobre o que dá para medir. O que sobra é olho, e não é
opcional: os 16 testes de rejeição de `extracao-pontos-negativos.md` §8 e os campos
`[A DEFINIR]` de `src/config.js` - preço, prazo de garantia,
URL da Ticto, id do pixel e o parâmetro de rastreio. Sem eles a página não vende.
