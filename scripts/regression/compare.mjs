// Uso: node scripts/regression/compare.mjs <A> <B> [pasta=f]
// Faz: compara pixels (RGBA idêntico) e estilo computado entre duas pastas de <raiz>/.regressao/<pasta>/.
// Escreve só no console. Não abre navegador e não exige playwright-core.
// node compare.mjs <A> <B> [pasta=f] : pixels (RGBA idêntico) e estilo computado, com alinhamento do DOM
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
const DIR = path.resolve(import.meta.dirname, "../../.regressao");
const [A, B, sub = "f"] = process.argv.slice(2);
function png(buf) {
  let i = 8;
  let w;
  let h;
  let ct;
  let idat = [];
  while (i < buf.length) {
    const n = buf.readUInt32BE(i);
    const t = buf.toString("latin1", i + 4, i + 8);
    const d = buf.subarray(i + 8, i + 8 + n);
    if (t === "IHDR") {
      w = d.readUInt32BE(0);
      h = d.readUInt32BE(4);
      ct = d[9];
    } else if (t === "IDAT") idat.push(d);
    i += 12 + n;
  }
  const bpp = ct === 6 ? 4 : ct === 2 ? 3 : 1;
  const st = w * bpp;
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const o = Buffer.alloc(h * st);
  for (let y = 0, p = 0; y < h; y++) {
    const f = raw[p++];
    const l = y * st;
    const u = l - st;
    for (let x = 0; x < st; x++) {
      const v = raw[p++];
      const a = x >= bpp ? o[l + x - bpp] : 0;
      const b = y ? o[u + x] : 0;
      const c = x >= bpp && y ? o[u + x - bpp] : 0;
      let r = v;
      if (f === 1) r += a;
      else if (f === 2) r += b;
      else if (f === 3) r += (a + b) >> 1;
      else if (f === 4) {
        const q = a + b - c;
        const pa = Math.abs(q - a);
        const pb = Math.abs(q - b);
        const pc = Math.abs(q - c);
        r += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      o[l + x] = r & 255;
    }
  }
  return { w, h, bpp, d: o };
}
const num = (v) => (/^-?[\d.]+px$/.test(v) ? parseFloat(v) : null);
const col = (v) => {
  const p = v.split(/,\s*(?![^(]*\))/);
  return p.every((x) => x === p[0]) ? p[0] : v;
};
function igual(k, a, b) {
  if (a === b) return true;
  if (
    /^(align|justify)-(items|self|content)$/.test(k) &&
    a.replace("flex-", "") === b.replace("flex-", "")
  )
    return true;
  if (/^(transition|animation)-/.test(k) && col(a) === col(b)) return true;
  const x = num(a);
  const y = num(b);
  return x !== null && y !== null && Math.abs(x - y) <= 0.02;
}
function alinhar(a, b) {
  // LCS por tag+texto
  const n = a.length;
  const m = b.length;
  const tagN = (t) => (t === "details" ? "div" : t === "summary" ? "button" : t);
  const chave = (e) =>
    tagN(e.tag) + "|" + (e.tag === "time" || /^\d+d \d+h/.test(e.txt) ? "" : e.txt);
  const ka = a.map(chave);
  const kb = b.map(chave);
  const L = new Array(n + 1);
  for (let i = 0; i <= n; i++) L[i] = new Uint16Array(m + 1);
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      L[i][j] = ka[i] === kb[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const par = [];
  const so = [[], []];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (ka[i] === kb[j]) {
      par.push([a[i], b[j]]);
      i++;
      j++;
    } else if (L[i + 1][j] >= L[i][j + 1]) so[0].push(a[i++]);
    else so[1].push(b[j++]);
  }
  while (i < n) so[0].push(a[i++]);
  while (j < m) so[1].push(b[j++]);
  return { par, so };
}
function cmpEstilo(a, b) {
  const fora = (e) =>
    e.cls.startsWith("contents") ||
    (e.tag === "canvas" && e.cls.startsWith("absolute.inset-0.size-full"));
  const { par, so } = alinhar(
    a.els.filter((e) => !fora(e)),
    b.els.filter((e) => !fora(e)),
  );
  const d = new Map();
  let tot = 0;
  const reg = (p, ea, va, vb) => {
    tot++;
    if (!d.has(p)) d.set(p, { n: 0, ex: `${va} -> ${vb} em <${ea.tag} .${ea.cls}> "${ea.txt}"` });
    d.get(p).n++;
  };
  if (a.doc.sh !== b.doc.sh || a.doc.sw !== b.doc.sw)
    reg(
      "doc",
      { tag: "html", cls: "", txt: "" },
      `${a.doc.sw}x${a.doc.sh}`,
      `${b.doc.sw}x${b.doc.sh}`,
    );
  for (const [x, y] of par) {
    if (x.v || y.v) continue;
    const midia = ["canvas", "img", "svg"].includes(x.tag);
    const infinita =
      x.e["animation-iteration-count"].includes("infinite") && x.e["animation-name"] !== "none";
    if (!infinita)
      for (const k of ["x", "y", "w", "h"])
        if (Math.abs(x[k] - y[k]) > 0.02) reg("rect." + k, x, x[k], y[k]);
    for (const p of Object.keys(x.e)) {
      const m = p.match(/^border-(top|right|bottom|left)-(style|color)$/);
      if (m && x.e[`border-${m[1]}-width`] === "0px" && y.e[`border-${m[1]}-width`] === "0px")
        continue;
      if (midia && (p === "vertical-align" || p === "max-width")) continue;
      if (
        infinita &&
        [
          "opacity",
          "background-position-x",
          "background-position-y",
          "text-shadow",
          "transform-origin",
        ].includes(p)
      )
        continue;
      if (!igual(p, x.e[p], y.e[p])) reg(p, x, x.e[p], y.e[p]);
    }
    for (const q of new Set([...Object.keys(x.ps), ...Object.keys(y.ps)])) {
      const pa = x.ps[q];
      const pb = y.ps[q];
      if (!pa || !pb) {
        reg(q, x, !!pa, !!pb);
        continue;
      }
      for (const p of Object.keys(pa)) {
        if (p === "opacity" && pa["animation-name"] !== "none") continue;
        if (!igual(p, pa[p], pb[p])) reg(q + " " + p, x, pa[p], pb[p]);
      }
    }
  }
  return { tot, d, so };
}
let px = 0;
let est = 0;
let est_so = 0;
const ra = path.join(DIR, sub, A);
const rb = path.join(DIR, sub, B);
for (const c of fs.readdirSync(ra).sort()) {
  const pa = path.join(ra, c);
  const pb = path.join(rb, c);
  if (!fs.existsSync(pb)) {
    console.log(c, "SEM PAR");
    continue;
  }
  const fa = fs
    .readdirSync(pa)
    .filter((f) => f.endsWith(".png"))
    .sort();
  const fb = fs.readdirSync(pb).filter((f) => f.endsWith(".png"));
  let dif = 0;
  let pior = 0;
  const lst = [];
  if (fa.length !== fb.length) lst.push(`telas ${fa.length} x ${fb.length}`);
  for (const f of fa) {
    if (!fb.includes(f)) continue;
    const ba = fs.readFileSync(path.join(pa, f));
    const bb = fs.readFileSync(path.join(pb, f));
    if (ba.equals(bb)) continue;
    const a = png(ba);
    const b = png(bb);
    if (a.w !== b.w || a.h !== b.h) {
      lst.push(`${f}: tamanho`);
      dif++;
      continue;
    }
    let n = 0;
    let n8 = 0;
    let x0 = 1e9;
    let y0 = 1e9;
    let x1 = -1;
    let y1 = -1;
    let md = 0;
    for (let y = 0; y < a.h; y++)
      for (let x = 0; x < a.w; x++) {
        let e = 0;
        let mx = 0;
        for (let k = 0; k < a.bpp; k++) {
          const dd = Math.abs(a.d[(y * a.w + x) * a.bpp + k] - b.d[(y * b.w + x) * b.bpp + k]);
          if (dd) e = 1;
          if (dd > mx) mx = dd;
        }
        if (e) {
          n++;
          if (mx > 8) n8++;
          if (mx > md) md = mx;
          if (x < x0) x0 = x;
          if (x > x1) x1 = x;
          if (y < y0) y0 = y;
          if (y > y1) y1 = y;
        }
      }
    if (n) {
      dif++;
      pior = Math.max(pior, n);
      lst.push(`${f}: ${n} px (>8: ${n8}, max ${md}) caixa ${x0},${y0}-${x1},${y1}`);
    }
  }
  px += dif;
  let linha = `${c.padEnd(20)} telas ${String(fa.length).padStart(3)}  com diferenca ${String(dif).padStart(3)} (pior ${pior} px)`;
  const ea = path.join(pa, "estilo.json");
  const eb = path.join(pb, "estilo.json");
  if (fs.existsSync(ea) && fs.existsSync(eb)) {
    const x = JSON.parse(fs.readFileSync(ea));
    const y = JSON.parse(fs.readFileSync(eb));
    for (const st of Object.keys(x).filter((k) => x[k]?.els)) {
      const r = cmpEstilo(x[st], y[st]);
      est += r.tot;
      est_so += r.so[0].length + r.so[1].length;
      linha += `  | ${st}: estilo ${r.tot}, so-A ${r.so[0].length}, so-B ${r.so[1].length}`;
      if (r.tot || r.so[0].length || r.so[1].length) {
        lst.push(`[${st}]`);
        for (const [p, v] of [...r.d.entries()].sort((q, w) => w[1].n - q[1].n).slice(0, 8))
          lst.push(`  ${String(v.n).padStart(4)}x ${p}: ${v.ex}`.slice(0, 210));
        if (r.so[0].length)
          lst.push(
            "  so-A: " +
              r.so[0]
                .slice(0, 6)
                .map((e) => `<${e.tag} .${e.cls}> "${e.txt}"`)
                .join(" ; ")
                .slice(0, 300),
          );
        if (r.so[1].length)
          lst.push(
            "  so-B: " +
              r.so[1]
                .slice(0, 6)
                .map((e) => `<${e.tag} .${e.cls}> "${e.txt}"`)
                .join(" ; ")
                .slice(0, 300),
          );
      }
    }
    if (x.erros?.length || y.erros?.length)
      lst.push(
        `erros A=${JSON.stringify(x.erros).slice(0, 200)} B=${JSON.stringify(y.erros).slice(0, 200)}`,
      );
    const rel = (t) =>
      t
        .replace(/a promoção acaba em [\d:]+/g, "RELOGIO")
        .replace(/\d+d \d+h \d+min \d+s \d+ms/g, "MS")
        .replace(/\d+:\d\d:\d\d/g, "RELOGIO");
    if (x.textoInicial !== undefined) {
      x.textoInicial = rel(x.textoInicial);
      y.textoInicial = rel(y.textoInicial);
    }
    if (x.textoInicial !== undefined && x.textoInicial !== y.textoInicial) {
      let i = 0;
      while (x.textoInicial[i] === y.textoInicial[i]) i++;
      lst.push(
        `TEXTO difere em ${i}: "${x.textoInicial.slice(i - 30, i + 60)}" x "${y.textoInicial.slice(i - 30, i + 60)}"`,
      );
    }
    if (x.hrefs && JSON.stringify(x.hrefs) !== JSON.stringify(y.hrefs)) lst.push("HREFS diferem");
  }
  console.log(linha);
  for (const l of lst.slice(0, 26)) console.log("   " + l);
}
console.log(
  `\nRESUMO ${A} x ${B}: telas com diferenca=${px}, diferencas de estilo=${est}, elementos sem par=${est_so}`,
);
