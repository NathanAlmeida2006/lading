// Metadados de busca e de compartilhamento: a landing tem canonical, Open Graph e twitter:card; robots.txt e sitemap.xml
// apontam para o mesmo domínio. O og-image.jpg é posto à mão em public/ (o teste não o exige: só a URL dele na tag).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const ler = (arquivo) => readFileSync(join(raiz, arquivo), "utf8");
const SITE = "https://lithium.app.br";

test("index.html: canonical, og:url, og:image 1200x630 e twitter:card summary_large_image", () => {
  const html = ler("index.html");
  assert.ok(html.includes(`<link rel="canonical" href="${SITE}/" />`));
  assert.ok(html.includes(`<meta property="og:url" content="${SITE}/" />`));
  assert.ok(html.includes(`<meta property="og:image" content="${SITE}/og-image.jpg" />`));
  assert.ok(html.includes('<meta property="og:image:width" content="1200" />'));
  assert.ok(html.includes('<meta property="og:image:height" content="630" />'));
  assert.ok(html.includes('<meta name="twitter:card" content="summary_large_image" />'));
});

test("robots.txt libera a indexacao e aponta para o sitemap; o sitemap lista a landing e os dois documentos", () => {
  const robots = ler("public/robots.txt");
  assert.match(robots, /^User-agent: \*$/m);
  assert.match(robots, /^Allow: \/$/m);
  assert.doesNotMatch(robots, /^Disallow:\s*\S/m);
  assert.ok(robots.includes(`Sitemap: ${SITE}/sitemap.xml`));
  const sitemap = ler("public/sitemap.xml");
  for (const caminho of ["/", "/privacy.html", "/terms.html"])
    assert.ok(sitemap.includes(`<loc>${SITE}${caminho}</loc>`), caminho);
});

test("o Node do build remoto: .node-version e engines pedem a mesma versao minima", () => {
  assert.equal(ler(".node-version").trim(), "22.12.0");
  assert.equal(JSON.parse(ler("package.json")).engines.node, ">=22.12.0");
});
