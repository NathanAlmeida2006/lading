/**
 * Injeta o HTML da pagina dentro de dist/index.html.
 *
 * Existe por causa do RNF-L16: a pagina precisa ser legivel ate o fim sem
 * JavaScript. Uma SPA React entrega <div id="raiz"></div> e mais nada, o que
 * reprovaria o requisito e ainda atrasaria o LCP do RNF-L01. Pre-renderizar no
 * build resolve os dois de uma vez, e o cliente so hidrata.
 */
import { readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const molde = join(raiz, "dist", "index.html");

/**
 * Trava de publicacao. `src/config.js` promete que o que esta `[A DEFINIR]` trava a publicacao, e
 * nada travava: o build saia com o checkout apontando para `.../DEFINIR`, o preco em branco e o
 * e-mail do rodape `[A DEFINIR]`. Sem `PUBLICAR`, so avisa (rascunho e preview); com `PUBLICAR=1`
 * no ambiente de producao, recusa o build.
 */
const { config } = await import(pathToFileURL(join(raiz, "src", "config.js")).href);
const pendente = (valor) => valor == null || (typeof valor === "string" && /definir/i.test(valor));
const faltam = Object.entries({
  "oferta.preco": config.oferta.preco,
  "oferta.garantiaDias": config.oferta.garantiaDias,
  "checkout.url": config.checkout.url,
  "pixel.id": config.pixel.id,
  "legal.responsavel": config.legal.responsavel,
  "legal.documento": config.legal.documento,
  "legal.contato": config.legal.contato,
})
  .filter(([, valor]) => pendente(valor))
  .map(([campo]) => campo);
if (faltam.length) {
  const aviso = `prerender  ${faltam.length} campo(s) [A DEFINIR] em src/config.js: ${faltam.join(", ")}`;
  if (process.env.PUBLICAR) {
    console.error(`${aviso}\n           PUBLICAR esta ligado: a pagina nao pode ir ao ar assim.`);
    process.exit(1);
  }
  console.warn(`${aviso}\n           (aviso: com PUBLICAR=1 isto trava o build)`);
}

const { renderizar } = await import(
  pathToFileURL(join(raiz, "dist-ssr", "entry-server.js")).href
);

const html = await readFile(molde, "utf8");
const marcador = "<!--app-html-->";
if (!html.includes(marcador)) {
  console.error(`prerender  marcador ${marcador} sumiu de index.html`);
  process.exit(1);
}

// Funcao, e nao texto: `$&` ou `$$` na copia da pagina seriam lidos como padrao de substituicao.
let saida = html.replace(marcador, () => renderizar());

/**
 * Declara os pedacos preguicosos no <head>.
 *
 * O Vite so escreve `<script>` para o pedaco de entrada. Um pedaco que entra
 * por `import()` fica invisivel para o navegador ate o pacote principal
 * executar e pedir por ele, e ai comeca uma ida e volta inteira do zero, em
 * serie. Foi o que aconteceu com o modulo de texto do anime.js, que e quem
 * revela o titulo da dobra: ele so era pedido aos 2,4 s de uma carga em 4G.
 *
 * `modulepreload` poe o pedido junto do pacote principal, em paralelo, sem
 * mudar quem executa o que nem quando. Os nomes carregam hash, entao a lista
 * sai do que o build produziu, e nao de uma constante que envelhece.
 */
const jsPreguicoso = (await readdir(join(raiz, "dist", "assets")))
  .filter((nome) => nome.endsWith(".js") && !saida.includes(nome));

if (jsPreguicoso.length) {
  const linhas = jsPreguicoso
    .map((nome) => `    <link rel="modulepreload" crossorigin href="/assets/${nome}">`)
    .join("\n");
  saida = saida.replace("</head>", () => `${linhas}\n  </head>`);
}

await writeFile(molde, saida, "utf8");
console.log(
  `prerender  index.html com a pagina dentro` +
    (jsPreguicoso.length ? `, ${jsPreguicoso.length} pedaco(s) em modulepreload` : ""),
);
