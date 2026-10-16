# fluor-landing

Landing page do Projeto Flúor, um protocolo de hipertrofia com o ângulo `teto-natural`. Este documento descreve a implementação consultada em 10/10/2026, sem declarar aprovação comercial ou publicação.

A fonte soberana é `~/Documentos/projetos/02-fluor/landing/requisitos-landing.md`. Em divergência, os requisitos prevalecem. Consulte o [relatório de validação](docs/validacao-rebranding.md) para resultados, evidências e lacunas.

## Executar localmente

Instale as dependências com `npm install` e inicie o desenvolvimento com `npm run dev`. Os tokens, fontes e wordmark existentes são preservados. `npm run sync:ds` é uma operação explícita de sincronização, separada do build: copia recursos do bundle soberano para o projeto e exige revisão do diff. A origem pode ser indicada por `DS_BUNDLE=/caminho/do/ds-bundle`.

Para verificar um build local, mantenha o preview aberto em outro terminal:

```bash
npm run build
npm run preview -- --host 127.0.0.1 --port 4173
```

```bash
CHROMIUM=/caminho/do/chrome npm run verificar -- http://127.0.0.1:4173/
CHROMIUM=/caminho/do/chrome npm run verificar:conversao -- http://127.0.0.1:4173/
```

As verificações usam `playwright-core` e precisam de Chromium disponível. A suíte adicional executa fixtures isoladas, intercepta rede externa e não comprova Pixel real, compra ou conversão.

## Comandos

| Comando | Finalidade |
| --- | --- |
| `npm run dev` | Desenvolvimento com Vite. |
| `npm run build` | Cliente, SSR, pré-renderização e orçamento; não sincroniza o design system. |
| `npm run preview` | Servir o build local. |
| `npm run size` | Conferir o orçamento do build existente. |
| `npm run verificar` | Verificações de navegador da página e dos comportamentos presentes. |
| `npm run verificar:conversao -- URL` | Integração de consentimento, eventos, oferta, componentes e CTA com fixtures isoladas. |
| `npm run sync:ds` | Sincronização explícita de recursos do bundle soberano. |

## Arquitetura implementada

React 19 hidrata o HTML produzido por SSR e pré-renderização no build Vite 6. Tailwind v4 permanece integrado pelo `@tailwindcss/vite`; `src/App.jsx` importa `src/styles/tailwind.css`, que integra o CSS complementar de `residual.css`. Tokens, fontes e temas Sigilo/Cartaz vêm do design system.

| Ordem na árvore | Responsabilidade |
| --- | --- |
| `Dobra` | Promessa e CTA de abertura. |
| `Manifesto` e `Espelho` | Reconhecimento do problema. |
| `Leva` | Apresentação do que o protocolo entrega. |
| `Semanas` | Mapa do caminho, condicionado à configuração. |
| `Amostra` | Trecho real, exibido somente quando habilitado. |
| `Oferta` | Apresentação comercial e condição factual configurada. |
| `Objecoes` | Respostas às objeções. |
| `Fechamento` | CTA final. |
| `RodapeLegal` | Identificação e referências legais. |

A ordem efetiva está em [App.jsx](src/App.jsx); IDs, presença e etapas de eventos estão em [secoes.js](src/secoes.js). Na configuração consultada, o mapa está ativo, a amostra está desativada por falta de trecho aprovado e a prova está ausente da árvore. Componentes existentes como `ProvaSocial` e `Garantia` não comprovam integração na página. O relatório registra essa diferença entre o contrato e a árvore atual.

`Consentimento`, `IndiceFixo`, `Doca`, `Intro` e `PausaMovimento` são controles transversais. O CTA compartilha o verbo `Começar o protocolo`. A doca depende de JavaScript e de suas regras de visibilidade.

## Contratos e limites

[config.js](src/config.js) centraliza os dados comerciais. Ausência de confirmação usa `null` ou flags explícitas; no preview, o checkout é a âncora segura `#oferta`. Preço, entrega, garantia, checkout, Pixel e dados legais exigem informações reais. `PUBLICAR=1 npm run build` recusa configurações incompletas e referências legais inválidas. Uma fixture completa aprovada em teste não preenche nem autoriza a configuração de produção.

[oferta.js](src/oferta.js) valida a condição comercial com fonte, confirmação, datas absolutas, fuso e correspondência ao checkout. O intervalo usa início inclusivo e fim exclusivo; o SSR apresenta estado neutro. Não há escassez fictícia nem contador reiniciado.

[instrumentacao.js](src/instrumentacao.js) captura parâmetros permitidos, preserva a query da URL-base e acrescenta atribuição quando confirmada. O envio depende de consentimento e Pixel configurado. A landing registra intenção de checkout e alcance; `Purchase` pertence à Ticto. Sem JavaScript, o link usa a URL-base e não repassa UTMs da visita.

Animejs entra por import dinâmico de [coreografias.js](src/motion/coreografias.js), solicitado após hidratação; a falha abre a leitura em vez de ocultar a copy. Lenis usa `syncTouch: false`, mantendo o toque nativo, e respeita movimento reduzido. A composição efetiva do bundle e o comportamento em execução precisam das verificações descritas no relatório.

O campo de pontos permanece em uso e sua decisão contra `TR-03` continua em aberto na fonte soberana. Não recebe aprovação implícita por existir ou por um teste técnico passar. Os limites de build são JavaScript gzip ≤120 KB e fontes ≤130 KB; valores medidos pertencem ao relatório da execução correspondente.

## Antes de publicar

Resolver os dados comerciais e legais, as divergências normativas e os defeitos documentados; validar a campanha com Pixel real e atribuição de compra na Ticto. Testes locais de interface e desempenho não demonstram aumento de conversão. Consulte também o [backlog dos Testes de Fogo](docs/testes-de-fogo-tarefas.md).
