# Etapa E1 · O primitivo Capítulo e os três capítulos travados

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fazer três seções da landing travarem na tela e avançarem painel a painel com a rolagem, com os painéis se acumulando em vez de se substituírem.

**Architecture:** O capítulo é uma pilha dentro da pilha. A página já é uma pilha de seções que grudam (`.js .secao`); o capítulo repete a mecânica um nível abaixo, com um trilho que fica no fluxo e mede, e painéis grudados que exibem. O padrão não é novo: `.mapa__fases` mais `.fase` já o implementam para os três cartões de fase, e este plano **generaliza o que já funciona** em vez de inventar mecânica.

**Tech Stack:** React 19, Vite 6, anime.js 4, CSS puro sobre tokens de `src/styles/tokens/`. Verificação com `playwright-core` via `npm run verificar`. Sem framework de teste unitário, e não se adiciona um.

**Spec:** `~/Documentos/projetos/02-fluor/landing/desenho-capitulos-e-interfaces.md`, seções 2, 3 e 10 (etapa E1).

## Global Constraints

Valores copiados literalmente da especificação e do `requisitos-landing.md`. Valem em toda tarefa.

- **`RNF-L04`:** JavaScript comprimido do build ≤ **120 KB**. Hoje 93,1 KB. `scripts/check-size.mjs` falha o build se passar.
- **`RNF-L28`:** **nenhuma dependência nova.** O projeto é React, Vite e CSS, e cada adição precisa provar que os três não resolvem. Esta etapa não adiciona nenhuma.
- **`RNF-L17`:** nenhum valor solto. Toda cor, tamanho, espaço e duração referencia token de `src/styles/tokens/`. `src/styles/tokens/` está no `.gitignore` e **não se edita**: divergiu, corrige na base e roda `npm run sync:ds`.
- **`RNF-L16`:** a página é utilizável **sem JavaScript** até a leitura completa da copy. Sem JS não há pilha de seções, e o capítulo degrada para leitura contínua.
- **`RNF-L13`:** com `prefers-reduced-motion: reduce`, toda animação degrada para opacidade. No capítulo isso significa **sem trava e sem corte**: leitura contínua.
- **`RNF-L35`:** nenhum elemento fica preso invisível. O estado inicial de revelação é escrito por JavaScript, nunca por CSS de arquivo. Painel coberto **não** é painel escondido: a caixa fica opaca, e quem recua é o conteúdo.
- **`RNF-L37`:** **`overflow: clip`, nunca `overflow: hidden`**, em qualquer ancestral de elemento grudado. `hidden` cria container de rolagem e desliga `position: sticky` em todo descendente, sem erro nenhum.
- **`RNF-L10`:** alvo de toque ≥ 48×48 px com ≥ 8 px de separação. Nesta etapa não nasce elemento operável, mas a regra vale se algum aparecer.
- **`RF-L11a`:** o mapa **não inventa programa**. Fases, semanas, séries e sessões saem do capítulo 3 do draft de hipertrofia e do `RF-T02`. Divergência entre o mapa e o protocolo é defeito do mapa.
- **`RF-L15`:** nenhum `§` no texto do leitor.
- **Decisão D5 da especificação:** a troca de painel é **revelação de marca**, e portanto **corta**. O apagamento do painel coberto usa `steps(2)`, não curva contínua.
- **Idioma:** todo conteúdo, comentário e mensagem de commit em português do Brasil. Comentários no código sem acento, seguindo o que os arquivos já fazem.
- **Nada de `transform` em ancestral de quem gruda**, e **`scale(1)` conta**: a matriz identidade quebra `position: sticky` nos descendentes igual a qualquer outra.

---

## Estrutura de arquivos

| Arquivo | Responsabilidade | Ação |
| --- | --- | --- |
| `src/components/Capitulo.jsx` | o primitivo: seção, cabeça, trilho e a lista de painéis grudados | criar |
| `src/styles/pagina.css` | o CSS do trilho, do painel e da degradação sem JS e com movimento reduzido | modificar |
| `src/motion/index.js` | `empilharBlocos()` ganha os parâmetros `interno` e `corte`; `empilharSecoes()` passa a conhecer `.painel-cap` | modificar |
| `src/sections/OQueE.jsx` | vira capítulo de 3 painéis | modificar |
| `src/sections/MapaDoze.jsx` | vira capítulo de 4 painéis, mantendo trilha e cartões de fase dentro do painel certo | modificar |
| `src/sections/Prova.jsx` | vira capítulo de 4 painéis, com o painel 03 reservado e vazio até a etapa E2 | modificar |
| `scripts/verificar.mjs` | duas checagens novas, `CAP-01` (mecânica) e `CAP-02` (cobertura) | modificar |

Não se toca em `src/App.jsx`: os capítulos continuam sendo `.secao`, e a busca `":scope > .secao, :scope > .painel"` já os alcança. Não se toca em `src/instrumentacao.js`: os `id` das três seções não mudam.

---

## Task 1: As duas checagens que ainda falham

**Files:**
- Modify: `scripts/verificar.mjs:250-255` (antes de `await nav.close()`)

**Interfaces:**
- Consumes: nada.
- Produces: as checagens `CAP-01` e `CAP-02`, que as tarefas 2 a 4 fazem passar. Contrato de markup que as tarefas seguintes precisam honrar: a seção do capítulo carrega `data-capitulo`, cada painel é `.painel-cap`, e a caixa interna dele é `.painel-cap__caixa`.

- [ ] **Step 1: Escrever as checagens que falham**

Inserir em `scripts/verificar.mjs`, imediatamente **antes** da linha `await nav.close();`:

```js
// --- CAP-01 e CAP-02: capitulos travados -----------------------------------
// A mecanica se le da GEOMETRIA, nunca de classe: acumular significa que, no
// fim do trilho, o topo de TODOS os paineis continua dentro da janela. Se um
// painel substituisse o outro, o de baixo teria saido pelo topo e o `top` dele
// seria negativo. E a caixa nunca apaga: quem recua e o conteudo (RNF-L35).
{
  const ctx = await nav.newContext({ viewport: { width: 360, height: 640 }, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  await p.goto(URL, { waitUntil: "networkidle" });
  await p.click("text=Aceitar").catch(() => {});

  const ids = await p.evaluate(() =>
    [...document.querySelectorAll("[data-capitulo]")].map((s) => s.id),
  );

  const falhas = [];
  for (const id of ids) {
    // Rolar ate o FIM do trilho do capitulo: e la que o acumulo esta completo.
    await p.evaluate((alvo) => {
      const secao = document.getElementById(alvo);
      window.scrollTo({ top: secao.offsetTop + secao.offsetHeight - window.innerHeight - 8, behavior: "instant" });
    }, id);
    await p.waitForTimeout(500);

    const r = await p.evaluate((alvo) => {
      const secao = document.getElementById(alvo);
      const paineis = [...secao.querySelectorAll(".painel-cap")];
      return {
        total: paineis.length,
        foraDaJanela: paineis.filter((el) => {
          const t = el.getBoundingClientRect().top;
          return t < -1 || t > window.innerHeight;
        }).length,
        caixaApagada: paineis.filter((el) => {
          const caixa = el.querySelector(".painel-cap__caixa");
          return caixa && parseFloat(getComputedStyle(caixa).opacity) < 0.99;
        }).length,
      };
    }, id);

    if (r.total < 2) falhas.push(`${id}: ${r.total} paineis, minimo 2`);
    if (r.foraDaJanela > 0) falhas.push(`${id}: ${r.foraDaJanela} paineis sairam da janela (substituiu em vez de acumular)`);
    if (r.caixaApagada > 0) falhas.push(`${id}: ${r.caixaApagada} caixas apagadas (o recuo vai no conteudo, nao na caixa)`);
  }

  linha("CAP-01", ids.length > 0 && falhas.length === 0,
    `${ids.length} capitulos, ${falhas.length} falhas de mecanica`);
  falhas.slice(0, 4).forEach((f) => console.log("            " + f));

  const esperados = ["o-que-e", "mapa", "prova"];
  const faltando = esperados.filter((e) => !ids.includes(e));
  linha("CAP-02", faltando.length === 0,
    faltando.length ? `faltam: ${faltando.join(", ")}` : "os tres capitulos da etapa E1 estao no ar");
  await ctx.close();
}
```

- [ ] **Step 2: Rodar e confirmar que as duas falham**

```bash
cd ~/Documentos/fluor-landing
npm run build
npx vite preview --port 4173 &
npm run verificar
```

Esperado: `CAP-01  FALHOU   0 capitulos, 0 falhas de mecanica` e `CAP-02  FALHOU   faltam: o-que-e, mapa, prova`. As dez checagens anteriores continuam passando.

- [ ] **Step 3: Commit**

```bash
git add scripts/verificar.mjs
git commit -m "test: checagens CAP-01 e CAP-02 para os capitulos travados"
```

---

## Task 2: O primitivo Capítulo e o capítulo "O que é"

**Files:**
- Create: `src/components/Capitulo.jsx`
- Modify: `src/styles/pagina.css` (bloco novo no fim, antes do bloco de grade de 12 colunas)
- Modify: `src/motion/index.js:482` (`empilharBlocos`) e `src/motion/index.js:634` (a lista de `temGrude` em `empilharSecoes`)
- Modify: `src/sections/OQueE.jsx`
- Test: `scripts/verificar.mjs`, checagem `CAP-01`

**Interfaces:**
- Consumes: `empilharBlocos`, `revelar`, `mascaraDeLinha`, `parallaxe` de `src/motion/index.js`.
- Produces:
  - `Capitulo({ id, indice, kicker, titulo, tema, grao, paineis })` de `src/components/Capitulo.jsx`, onde `paineis` é `Array<{ titulo: string, conteudo: ReactNode }>`. Renderiza `<section data-capitulo>` com `.capitulo__paineis` e `.painel-cap` mais `.painel-cap__caixa`.
  - `empilharBlocos(blocos, { interno = ".fase__cartao", corte = false })` em `src/motion/index.js`.

- [ ] **Step 1: Parametrizar `empilharBlocos`**

Em `src/motion/index.js`, trocar a assinatura e as duas linhas que dependem dela:

```js
export function empilharBlocos(blocos, { interno = ".fase__cartao", corte = false } = {}) {
  const lista = Array.from(blocos ?? []);
  if (!lista.length || semMovimento()) return;
  for (const [indice, bloco] of lista.entries()) {
    if (indice === lista.length - 1) continue;
    const cartao = bloco.querySelector(interno) ?? bloco;
```

e, no primeiro `animate` do laço, trocar só a curva:

```js
    animate([...cartao.children], {
      opacity: [1, 0.45],
      // `corte` e a decisao D5 da especificacao: a troca de painel de capitulo
      // e REVELACAO DE MARCA, e revelacao de marca corta. Os cartoes de fase
      // continuam em `linear`, que e movimento de layout.
      ease: corte ? steps(2) : "linear",
      autoplay: onScroll({ target: bloco, enter: "top top", leave: "top bottom", sync: 0.3 }),
    });
```

- [ ] **Step 2: Ensinar `.painel-cap` ao `empilharSecoes`**

Em `src/motion/index.js`, na lista de `temGrude`, acrescentar a classe nova:

```js
    const temGrude = [
      ...conteudo.querySelectorAll(".secao__cabeca, .mapa__trilha, .fase, .painel-cap"),
    ].some((el) => getComputedStyle(el).position === "sticky");
```

Isto **não é opcional.** O comentário logo acima dessa linha registra a regra: quem declarar `position: sticky` numa classe nova precisa citá-la aqui. Sem isso o `empilharSecoes()` escala o `.envelope` do capítulo, o ancestral transformado deixa de ser transparente para o `sticky` dos painéis, e os painéis desgrudam no meio da leitura. É o mesmo defeito que já quebrou o mapa uma vez.

- [ ] **Step 3: Escrever o CSS do primitivo**

Acrescentar em `src/styles/pagina.css`, antes do bloco `@media (min-width: 1024px)` da grade de 12 colunas:

```css
/* ---- O capitulo travado --------------------------------------------------
   Uma pilha dentro da pilha. A conta e a mesma de `.mapa__fases`, e nao por
   coincidencia: o `.fase` ja e este primitivo em escala menor, e generalizar o
   que funciona custa menos que inventar mecanica nova.

   `46svh` de painel deixa o trilho em 300svh com tres paineis e 400svh com
   quatro, que e o curso que a especificacao fixa. As duas medidas saem da mesma
   variavel de proposito: separadas, divergem na primeira vez que alguem mexer
   em uma. */
.capitulo__paineis {
  --painel-alto: 46svh;
  /* O degrau. `--space-8` (64px) e o que deixa aparecer o fio, o respiro e o
     CONTADOR do painel coberto. Acumulo que nao se le e so sobreposicao. */
  --degrau-painel: var(--space-8);

  display: flex;
  flex-direction: column;
  list-style: none;
  margin: 0;
  padding: 0;
  /* Curso por `gap`, NUNCA por `margin-bottom`: a trava do `sticky` e a caixa
     de MARGEM dentro do bloco de contencao, entao margem embaixo do painel
     tira exatamente esse tanto do curso de grude dele. */
  gap: calc(100svh - var(--painel-alto));
}

/* O curso do ULTIMO painel. A trava do `sticky` e o CONTENT BOX, e padding nao
   conta: com a lista terminando no rodape do ultimo painel, o teto de grude de
   todos vira a posicao de fluxo do ultimo. Um `::after` e item de flex e estica
   o content box de verdade. */
.capitulo__paineis::after {
  content: "";
  display: block;
  flex: none;
  height: calc(100svh - var(--painel-alto));
}

.painel-cap {
  position: sticky;
  top: calc(var(--space-6) + var(--ordem) * var(--degrau-painel));
  /* Sem isto, um `z-index` declarado dentro de um painel sobe para o contexto
     de empilhamento da raiz e passa por cima das SECOES seguintes, que so tem
     `z-index: auto`. E a mesma trava que cada camada da pilha ja carrega. */
  isolation: isolate;
}

.painel-cap__caixa {
  position: relative;
  padding: var(--space-5);
  background: var(--surface-1);
  border: var(--hairline) solid var(--line-strong);
  min-height: var(--painel-alto);
  transform-origin: 50% 0;
  will-change: transform, opacity;
}

.painel-cap__conta {
  display: block;
  /* `--silver`, que e o token de texto secundario e micro-registro, e o mesmo
     que `.fase__marcador` usa. 6,15:1 sobre o fundo escuro. */
  color: var(--silver);
  margin-bottom: var(--space-3);
}

.painel-cap__titulo {
  margin: 0 0 var(--space-4);
}

/* Degradacao. Sem trava e sem corte: leitura continua, do primeiro painel ao
   ultimo. E a promessa da secao 2.4 da especificacao, e o que o RNF-L13 exige.
   O caso sem JavaScript nao precisa de regra propria: sem trava a lista ja le
   inteira, e o `sticky` daqui nao esconde nada porque os paineis acumulam. */
@media (prefers-reduced-motion: reduce) {
  .painel-cap { position: static; }
  .capitulo__paineis { gap: var(--space-6); }
  .capitulo__paineis::after { display: none; }
}
```

- [ ] **Step 4: Escrever o componente**

Criar `src/components/Capitulo.jsx`:

```jsx
import { useEffect, useRef } from "react";
import { empilharBlocos, mascaraDeLinha, parallaxe, revelar } from "../motion/index.js";

/**
 * Um capitulo travado: uma pilha DENTRO da pilha.
 *
 * A pagina inteira ja e uma pilha de secoes que grudam. O capitulo repete essa
 * mecanica um nivel abaixo, e por isso custa pouco: e o mesmo padrao que os
 * cartoes de fase do mapa (`.mapa__fases` mais `.fase`) ja pagaram com defeito
 * medido em 05/09/2026.
 *
 * Quem gruda nunca e quem mede. O trilho (`.capitulo__paineis`) fica no fluxo e
 * e o bloco de contencao; os paineis grudam dentro dele. Com o grude numa
 * camada de dentro do painel, o curso acabaria junto com o painel e ele iria
 * embora - isso e substituicao, nao acumulo.
 *
 * Painel COBRE, painel nao some. Nenhum painel e escondido por opacidade nem
 * por `display`, e e isso que mantem o RNF-L35 verde sem excecao nova no
 * verificador: painel coberto nao e painel invisivel. O apagamento vai no
 * CONTEUDO, nunca na caixa - caixa semitransparente sobre caixa deixa o texto
 * de baixo atravessar o de cima.
 */
export function Capitulo({
  id,
  indice,
  kicker,
  titulo,
  paineis,
  tema = "sigilo",
  grao = false,
}) {
  const raiz = useRef(null);

  useEffect(() => {
    const no = raiz.current;
    if (!no) return;
    revelar(no.querySelector(".secao__kicker"));
    mascaraDeLinha(no.querySelector(".secao__titulo"), { atraso: 60 });
    parallaxe(no.querySelector(".secao__indice"), { fator: 0.14 });
    // `corte: true` e a decisao D5: a troca de painel e revelacao de marca, e
    // revelacao de marca corta. Os cartoes de fase seguem em curva continua.
    empilharBlocos(no.querySelectorAll(".painel-cap"), {
      interno: ".painel-cap__caixa",
      corte: true,
    });
  }, []);

  return (
    <section
      id={id}
      ref={raiz}
      data-capitulo=""
      className={`secao capitulo${grao ? " grao" : ""}`}
      data-theme={tema === "cartaz" ? "cartaz" : undefined}
    >
      <div className="envelope">
        <header className="secao__cabeca">
          {indice && (
            <span className="secao__indice stat" aria-hidden="true" data-num>
              {String(indice).padStart(2, "0")}
            </span>
          )}
          {kicker && (
            <span className="secao__kicker overline" data-revelar>
              <span className="glifo" aria-hidden="true">
                &#8627;
              </span>
              {kicker}
            </span>
          )}
          {titulo && (
            <h2 className="secao__titulo h1" data-revelar>
              {titulo}
            </h2>
          )}
        </header>

        <ol className="capitulo__paineis">
          {paineis.map((painel, ordem) => (
            <li
              className="painel-cap"
              key={painel.titulo}
              style={{ "--ordem": ordem, zIndex: ordem + 1 }}
            >
              <article className="painel-cap__caixa">
                <span className="painel-cap__conta mono-reg" data-num>
                  {String(ordem + 1).padStart(2, "0")} / {String(paineis.length).padStart(2, "0")}
                </span>
                <h3 className="painel-cap__titulo h3">{painel.titulo}</h3>
                {painel.conteudo}
              </article>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
```

> **Correção em execução (05/09/2026):** este passo foi escrito para **três** painéis e a
> execução provou que não fecha. O painel "O dentro", com os seis cartões do catálogo, mede
> **1528px** a 360px de largura, contra os ~294px que o `--painel-alto` de 46svh assume, e um
> painel mais alto que o próprio curso de grude é empurrado para fora da janela no fim do
> trilho: o `CAP-01` reprova, corretamente. A correção divide "O dentro" em **dois painéis de
> três cartões** ("As regras" com os cartões 01, 02 e 04; "O que se usa" com 03, 05 e 06), e o
> capítulo passa a ter **quatro** painéis, com trilho de 400svh. Nenhum cartão é cortado e o
> CSS do Step 3 não muda. O raciocínio completo e as três alternativas descartadas estão em
> `.superpowers/sdd/2026-09-05-capitulo-travado-e1/progress.md`. A tabela da §3.1 da
> especificação passa a precisar de uma linha de emenda.

- [ ] **Step 5: Converter "O que é" em capítulo de três painéis**

Substituir o corpo de `src/sections/OQueE.jsx`. A constante `CARTOES` e os comentários de topo do arquivo ficam como estão; muda o que vem do `export function` para baixo, mais o import.

Trocar o bloco de imports inteiro. As três linhas de hoje (`useEffect`/`useRef` do React, `Secao` e `revelarEmCascata`) saem, e entra uma só:

```jsx
import { Capitulo } from "../components/Capitulo.jsx";
```

O componente não tem mais efeito próprio: quem revela o cabeçalho é o `Capitulo`, e a cascata dos cartões saiu pelo motivo explicado no fim deste passo. Depois da troca, `useEffect`, `useRef` e `revelarEmCascata` ficam sem uso no arquivo, e deixá-los importados é ruído que o próximo leitor vai tentar entender.

E o componente:

```jsx
/**
 * Os tres paineis vem da secao 3.1 da especificacao: o objeto, o dentro e o que
 * nao e. Os seis cartoes do catalogo moram no painel 02, que e o do "dentro".
 *
 * A revelacao em cascata dos cartoes saiu: dentro de um painel grudado ela
 * dispararia com o painel ja parado na tela, o que le como conteudo chegando
 * atrasado. O que revela agora e a chegada do proprio painel.
 */
export function OQueE() {
  const paineis = [
    {
      titulo: "O objeto",
      conteudo: (
        <>
          <p className="body-lg prosa">
            Um PDF e um EPUB, entregues por e-mail em minutos. Não é curso, não
            é grupo, não é assinatura: é um arquivo que fica com você.
          </p>
          <p className="body prosa">
            Dentro dele, o programa completo de doze semanas e os sete anexos do
            Kit, que é o que você abre no celular dentro da academia.
          </p>
        </>
      ),
    },
    {
      titulo: "O dentro",
      conteudo: (
        <ul className="cartoes">
          {CARTOES.map((cartao, indice) => (
            <li className="cartao" key={cartao.titulo}>
              <span className="cartao__indice mono-reg" aria-hidden="true" data-num>
                {String(indice + 1).padStart(2, "0")}
              </span>
              <h4 className="cartao__titulo h3">{cartao.titulo}</h4>
              <p className="cartao__corpo body prosa">{cartao.corpo}</p>
            </li>
          ))}
        </ul>
      ),
    },
    {
      titulo: "O que não é",
      conteudo: (
        <>
          <p className="body prosa">
            Não é dieta. O que você come tem protocolo próprio, e este aqui não
            se mete nisso.
          </p>
          <p className="body prosa">
            Não é suplemento, e não vende nenhum.
          </p>
          <p className="body prosa">
            E não é o treino de quem usa. O teto de um natural é outro, e a
            página inteira existe para dizer onde ele fica.
          </p>
        </>
      ),
    },
  ];

  return (
    <Capitulo
      id="o-que-e"
      indice={3}
      tema="cartaz"
      kicker="O que você leva"
      titulo="Um protocolo, não um feed"
      paineis={paineis}
    />
  );
}
```

O `data-revelar` saiu dos `<li class="cartao">` de propósito: eles agora vivem dentro de um painel que gruda, e revelação por `IntersectionObserver` dentro de elemento grudado dispara com o elemento já parado na tela. Deixar o atributo criaria justamente o "elemento preso invisível" que o `RNF-L35` proíbe.

O `<h3>` do cartão virou `<h4>`: o título do painel passou a ocupar o `h3`, e o `RNF-L15` exige hierarquia de cabeçalho contínua. A classe `h3` continua, porque ela é escala tipográfica, não nível semântico.

- [ ] **Step 6: Rodar e confirmar CAP-01 verde, CAP-02 ainda vermelha**

```bash
cd ~/Documentos/fluor-landing
npm run build
npx vite preview --port 4173 &
npm run verificar
```

Esperado: `CAP-01  ok       1 capitulos, 0 falhas de mecanica` e `CAP-02  FALHOU   faltam: mapa, prova`. As dez checagens anteriores continuam passando, `RNF-L16` e `RNF-L35` incluídos.

- [ ] **Step 7: Commit**

```bash
git add src/components/Capitulo.jsx src/styles/pagina.css src/motion/index.js src/sections/OQueE.jsx
git commit -m "feat: primitivo Capitulo e o capitulo O que e, em tres paineis"
```

---

## Task 3: O capítulo "Mapa das 12 semanas"

**Files:**
- Modify: `src/sections/MapaDoze.jsx`
- Test: `scripts/verificar.mjs`, checagens `CAP-01` e `RNF-L35`

**Interfaces:**
- Consumes: `Capitulo` de `src/components/Capitulo.jsx`, com a assinatura da Task 2. `acenderTrilha` e `empilharBlocos` de `src/motion/index.js`.
- Produces: nada que outra tarefa consuma.

O conteúdo dos quatro painéis é canônico e sai do capítulo 3 do draft de hipertrofia. **Não reescreva nenhum número.** As fases são semanas 1 e 2, 3 a 8, e 9 a 12, e a constante `FASES` no topo do arquivo já as carrega corretamente.

- [ ] **Step 1: Reescrever o componente `MapaDoze`**

Em `src/sections/MapaDoze.jsx`, manter intactos a constante `FASES`, a constante `SEMANAS` e a função `Trilha()`. Trocar os imports e o `export function MapaDoze`:

```jsx
import { useEffect, useRef } from "react";
import { Capitulo } from "../components/Capitulo.jsx";
import { acenderTrilha, empilharBlocos } from "../motion/index.js";
```

```jsx
/**
 * O mapa, agora em capitulo de quatro paineis (secao 3.2 da especificacao).
 *
 * Os tres cartoes de fase continuam existindo e continuam se acumulando, mas
 * dentro do painel 01: eles sao o resumo do caminho, e os paineis 02 a 04 sao
 * cada fase por extenso mais o portao.
 *
 * A trilha das doze semanas fica no painel 01, junto dos cartoes, porque e la
 * que ela tem o que medir. Ela continua `aria-hidden`: a informacao ja esta
 * escrita nos cartoes, em texto, e ler doze numeros soltos nao ajuda ninguem.
 */
export function MapaDoze() {
  const raiz = useRef(null);

  useEffect(() => {
    const no = raiz.current;
    if (!no) return;
    // O terceiro argumento e o CONTEXTO de medida do progresso, e agora ele e o
    // proprio `no`: o ref saiu da <section> e passou a viver no `.mapa__corpo`,
    // dentro do painel 01. Escrever `no.querySelector(".mapa__corpo")` aqui
    // devolveria `null`, porque `no` JA E o `.mapa__corpo`, e a trilha nunca
    // acenderia.
    acenderTrilha(
      no.querySelector(".trilha__fio--vivo"),
      no.querySelectorAll(".trilha__semana"),
      no,
    );
    empilharBlocos(no.querySelectorAll(".fase"));
  }, []);

  const paineis = [
    {
      titulo: "O caminho inteiro",
      conteudo: (
        <div className="mapa__corpo" ref={raiz}>
          <div className="mapa__trilha">
            <div className="trilha">
              <span className="trilha__fio" aria-hidden="true" />
              <span className="trilha__fio trilha__fio--vivo" aria-hidden="true" />
              <Trilha />
            </div>
          </div>

          <ol className="mapa__fases">
            {FASES.map((fase, indice) => (
              <li className="fase" key={fase.numero} style={{ "--ordem": indice, zIndex: indice + 1 }}>
                <article className="fase__cartao">
                  <span className="fase__marcador overline" data-num>
                    Fase {fase.numero} &middot; {fase.semanas}
                  </span>
                  <h4 className="fase__nome display">{fase.nome}</h4>
                  <p className="fase__resumo body prosa">{fase.resumo}</p>
                  <span className="fase__faixa mono-reg" aria-hidden="true" data-num>
                    {String(fase.de).padStart(2, "0")} &rarr; {String(fase.ate).padStart(2, "0")}
                  </span>
                </article>
              </li>
            ))}
          </ol>
        </div>
      ),
    },
    ...FASES.map((fase) => ({
      titulo: `Fase ${fase.numero} · ${fase.nome}`,
      conteudo: (
        <>
          <span className="overline" data-num>{fase.semanas}</span>
          <p className="body-lg prosa">{fase.resumo}</p>
          <p className="body prosa">{fase.objetivo}</p>
        </>
      ),
    })),
  ];

  return (
    <Capitulo
      id="mapa"
      indice={4}
      tema="sigilo"
      kicker="O caminho"
      titulo="Doze semanas, três fases"
      paineis={paineis}
    />
  );
}
```

O `<h3 class="fase__nome">` virou `<h4>` pelo mesmo motivo do cartão da Task 2: o `h3` agora é do título do painel.

O `<p className="fase__objetivo">` saiu do cartão e foi para o painel da fase correspondente, que é onde ele tem espaço. O cartão fica com marcador, nome, resumo e faixa, que é o que cabe em `34svh`.

- [ ] **Step 2: Conferir o aninhamento de `sticky`**

Este é o passo que decide se a tarefa deu certo. `.fase` gruda **dentro** de `.painel-cap`, que gruda dentro de `.secao`, que gruda dentro de `<main>`. Três níveis.

```bash
cd ~/Documentos/fluor-landing
npm run build
npx vite preview --port 4173 &
npm run verificar
```

Esperado: `CAP-01  ok       2 capitulos, 0 falhas de mecanica` e `CAP-02  FALHOU   faltam: prova`.

Se `CAP-01` reprovar com "saíram da janela" no `mapa`, a causa quase certa é um `transform` num ancestral: confira que o Step 2 da Task 2 acrescentou `.painel-cap` à lista de `temGrude` em `empilharSecoes()`, e que nenhuma regra nova pôs `overflow: hidden` no caminho.

- [ ] **Step 3: Conferir à mão que os cartões de fase ainda acumulam**

O `CAP-01` mede os painéis, não os cartões dentro deles. Abra `http://localhost:4173/` num viewport de 360×640, role até o fim do painel 01 do mapa e confirme que **os três cartões de fase estão na tela ao mesmo tempo**, com o marcador e o nome de cada um legíveis. Um cartão só na tela é o defeito de substituição que já foi corrigido uma vez.

- [ ] **Step 4: Commit**

```bash
git add src/sections/MapaDoze.jsx
git commit -m "feat: o mapa das 12 semanas em capitulo de quatro paineis"
```

---

## Task 4: O capítulo "Prova"

**Files:**
- Modify: `src/sections/Prova.jsx`
- Test: `scripts/verificar.mjs`, checagens `CAP-01`, `CAP-02` e `RNF-L09`

**Interfaces:**
- Consumes: `Capitulo` de `src/components/Capitulo.jsx`. `Regua` de `src/components/Regua.jsx`.
- Produces: o painel 03, com `id="regua-honesta"` na caixa, que a etapa E2 preenche com o simulador.

- [ ] **Step 1: Reescrever `Prova`**

Substituir `src/sections/Prova.jsx` inteiro. Os comentários de topo do arquivo original continuam valendo e ficam:

```jsx
import { Capitulo } from "../components/Capitulo.jsx";
import { Regua } from "../components/Regua.jsx";

/**
 * A prova, em capitulo de quatro paineis (secao 3.3 da especificacao).
 *
 * Lastro: dossie-hipertrofia, o achado de Kouri e colaboradores (1995) sobre o
 * teto natural, e o de Damas e colaboradores (2016) sobre o que e musculo e o
 * que e inchaco de reparo nas primeiras semanas.
 *
 * Duas travas do angulo valem literalmente aqui:
 *
 *   1. Substancia so aparece como DADO COMPARATIVO. Nenhum composto, nenhuma
 *      dose, nenhuma fonte, e nada que soe promocional.
 *   2. Nenhum corpo, nenhum antes e depois, nenhum nome de pessoa real como
 *      alvo estetico (RF-L17). O alvo se descreve pelo arquetipo.
 *
 * E nenhum §: o leitor procura pelo nome, nunca pela coordenada (RF-L15).
 *
 * O painel 03 nasce vazio de propriedade e cheio de promessa: ele e o lugar do
 * simulador, que e a etapa E2. Ate la ele carrega a pergunta em texto, que ja
 * e argumento, e nao um espaco reservado.
 */
export function Prova() {
  const paineis = [
    {
      titulo: "O número",
      conteudo: (
        <>
          <p className="body-lg prosa">
            Em 1995, um grupo de pesquisadores mediu a massa livre de gordura de
            atletas <strong>livres de drogas</strong> e de quem usava. O índice
            dos naturais ficou praticamente todo em 25 ou abaixo, com média perto
            de 21,8. A faixa de 25 a 35 era ocupada por quem usava.
          </p>
          <Regua />
        </>
      ),
    },
    {
      titulo: "O intervalo",
      conteudo: (
        <>
          <p className="body-lg prosa">
            O que dá para esperar de verdade: estudos que mediram massa magra em
            homens não treinados encontram algo em torno de{" "}
            <strong>1 a 1,6 kg em 10 a 12 semanas</strong>.
          </p>
          <p className="body prosa">
            Parte do que muda nas primeiras semanas nem é músculo novo, é inchaço
            de reparo. O crescimento de verdade aparece entre a terceira e a
            décima semana. É pouco comparado ao feed, e é exatamente o que a
            medida mostra.
          </p>
        </>
      ),
    },
    {
      titulo: "A régua honesta",
      conteudo: (
        <div id="regua-honesta">
          <p className="body-lg prosa">
            Essa faixa foi medida em quem nunca treinou com constância. Se esse
            não é o seu caso, o número muda, e nenhum estudo desta página mediu o
            seu.
          </p>
          <p className="body prosa">
            Dizer isso custa uma venda de vez em quando. Inventar um número custa
            a próxima.
          </p>
        </div>
      ),
    },
    {
      titulo: "A fonte",
      conteudo: (
        <>
          <p className="body prosa">
            O teto natural é real, e fica <strong>muito acima</strong> do corpo
            de quem nunca treinou de forma consistente. Dizer que existe um
            limite é o argumento, não a ressalva.
          </p>
          <p className="body prosa">
            &ldquo;Natural não cresce&rdquo; confunde <em>não fico igual a quem
            usa</em> com <em>não cresço</em>. As duas frases não são a mesma, e é
            a primeira que está te travando.
          </p>
          <span className="fonte-citada mono-reg">
            Kouri e colaboradores, 1995 &middot; Damas e colaboradores, 2016
            &middot; fontes completas dentro do protocolo
          </span>
        </>
      ),
    },
  ];

  return (
    <Capitulo
      id="prova"
      indice={5}
      tema="sigilo"
      kicker="A prova"
      titulo="Existe um teto. Ele foi medido."
      paineis={paineis}
      grao
    />
  );
}
```

- [ ] **Step 2: Rodar e confirmar as duas checagens verdes**

```bash
cd ~/Documentos/fluor-landing
npm run build
npx vite preview --port 4173 &
npm run verificar
```

Esperado: `CAP-01  ok       3 capitulos, 0 falhas de mecanica` e `CAP-02  ok       os tres capitulos da etapa E1 estao no ar`. `RNF-L09` continua verde nos dois temas: o painel usa `--surface-1` sobre `--void`, que é o mesmo par que `.fase__cartao` já usa e já foi medido.

- [ ] **Step 3: Commit**

```bash
git add src/sections/Prova.jsx
git commit -m "feat: a prova em capitulo de quatro paineis, com o lugar da regua honesta"
```

---

## Task 5: A degradação, medida e não presumida

**Files:**
- Test: `scripts/verificar.mjs`, checagens `RNF-L16` e `RNF-L13`
- Modify: `src/styles/pagina.css`, só se alguma das duas reprovar

**Interfaces:**
- Consumes: tudo das tarefas 2 a 4.
- Produces: nada.

- [ ] **Step 1: Rodar a bateria inteira e ler as duas linhas de degradação**

```bash
cd ~/Documentos/fluor-landing
npm run build
npx vite preview --port 4173 &
npm run verificar
```

Esperado, nas doze linhas: `RNF-L16  ok` com contagem de texto **maior** que antes desta etapa (os painéis acrescentaram copy) e `0 elementos escondidos`, e `RNF-L13  ok` com `0 escondidos, 0 ainda com transform residual`.

- [ ] **Step 2: Conferir à mão a leitura sem JavaScript**

No DevTools, desligar o JavaScript, recarregar em 360×640 e rolar a página inteira. Os painéis de cada capítulo devem aparecer **todos**, empilhados com o degrau, e nenhum texto pode ficar coberto de forma irrecuperável. Sem `.js` não há pilha de seções, e o capítulo continua legível do primeiro painel ao último.

- [ ] **Step 3: Conferir à mão o movimento reduzido**

No DevTools, emular `prefers-reduced-motion: reduce` e rolar a página inteira. Os painéis **não** devem grudar: a regra de mídia do Step 3 da Task 2 os põe em `position: static` e a lista vira leitura contínua. Nenhum painel apaga.

- [ ] **Step 4: Corrigir, se alguma das duas reprovar**

Se `RNF-L16` acusar elementos escondidos, o suspeito é um `data-revelar` que sobrou dentro de um painel. Remova o atributo: dentro de elemento grudado, revelação por `IntersectionObserver` dispara com o elemento já parado na tela, e o que sobra é conteúdo preso invisível.

Se o movimento reduzido ainda travar, confira que a regra de mídia entrou **depois** da declaração de `.painel-cap` no arquivo: as duas têm a mesma especificidade, e a última vence.

- [ ] **Step 5: Commit, se houve correção**

```bash
git add src/styles/pagina.css src/sections
git commit -m "fix: degradacao dos capitulos sem JavaScript e com movimento reduzido"
```

---

## Task 6: O orçamento e o fechamento da etapa

**Files:**
- Test: `scripts/check-size.mjs`
- Create: `~/Documentos/projetos/_checkpoints/AAAA-MM-DD-landing-e1-capitulos-travados.md`, com `AAAA-MM-DD` sendo a data do dia em que a etapa for executada, que é a convenção de nome do `_checkpoints/README.md`

**Interfaces:**
- Consumes: tudo.
- Produces: o checkpoint que encerra a operação na base de documentação.

- [ ] **Step 1: Medir o orçamento**

```bash
cd ~/Documentos/fluor-landing
npm run build
```

O `check-size.mjs` roda no fim do build e falha se o JavaScript comprimido passar de 120 KB ou as fontes de 130 KB. Anote o número real de JavaScript: a etapa E1 não acrescenta biblioteca, então o esperado é ficar **perto dos 93,1 KB de hoje**, com a diferença sendo só o componente novo. Se saltar mais de 5 KB, algo entrou que não deveria.

- [ ] **Step 2: Rodar a bateria completa uma última vez**

```bash
npx vite preview --port 4173 &
npm run verificar
```

Esperado: doze linhas, todas `ok`, mais a linha de medida do `RNF-L01`.

- [ ] **Step 3: Escrever o checkpoint na base**

A regra do `CLAUDE.md` da base é literal: toda operação que mudou a base em disco termina em checkpoint, e sem ele a operação não está encerrada. Copie `~/Documentos/projetos/_checkpoints/_template-checkpoint.md`, troque `tipo: template` por `tipo: checkpoint`, e preencha com `projeto: fluor`, o que foi pedido, o que foi feito, e as listas de criado, modificado e pendente. O número de JavaScript medido no Step 1 entra no texto: é o dado que a etapa E2 vai querer comparar.

- [ ] **Step 4: Commit**

```bash
cd ~/Documentos/fluor-landing
git add -A
git commit -m "chore: fecha a etapa E1, tres capitulos travados e orcamento medido"
```

---

## O que esta etapa deliberadamente não faz

Cada item abaixo é da etapa E2 ou E3 da especificação, e tentar antecipar um deles aqui é o que faz a etapa não fechar:

- **Nenhuma imagem.** Os seis fragmentos de estátua são a etapa E3, e dependem da escolha das fotografias.
- **Nenhum elemento operável.** A régua das doze semanas continua sendo ornamento ligado à rolagem, `aria-hidden`, e não recebe toque. A oferta e as objeções não viram `<details>`. O simulador não existe: o painel 03 da prova carrega a pergunta em texto.
- **Nenhuma doca.** Ela é E2.
- **Nenhuma instrumentação nova.** Os eventos de painel são E3, e `src/instrumentacao.js` não se toca.
- **Nenhuma emenda ao `requisitos-landing.md`.** As seis emendas propostas na seção 9 da especificação sobem quando o gerente do projeto validar, e não como efeito colateral de um commit de código.

E um item que **é** da especificação e sai desta etapa de propósito:

- **O painel 02 de "O que é" não rompe o envelope no desktop**, apesar de a seção 3.1 da especificação pedir isso. O catálogo de cartões continua dentro dos 720px do `.envelope` nos dois breakpoints. A ruptura para as 12 colunas mexe no bloco de grade de `pagina.css`, que é a peça que a auto-revisão do plano identificou como a mais fácil de quebrar em silêncio, e ela não tem checagem automatizada: a verificação hoje é a captura a 390px, que não enxerga desktop. Vai para a **E2**, junto com a checagem de largura que falta. Registrar aqui para não parecer esquecimento.
