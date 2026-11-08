#!/bin/bash
# uso: construir.sh <rotulo> [origem]
# Faz: copia a arvore do repositorio (sem node_modules, dist e .regressao) para <raiz>/.regressao/b/<rotulo> e roda `npm run build` la, sem tocar no repositorio.
# Escreve em <raiz>/.regressao/b/<rotulo>. Nao usa navegador. Usa o node_modules do projeto (symlink).
set -o pipefail
V="$(cd "$(dirname "$0")/../.." && pwd)/.regressao"; R=${2:-$(cd "$(dirname "$0")/../.." && pwd)}; D="$V/b/$1"
rm -rf "$D"; mkdir -p "$D"
rsync -a --exclude node_modules --exclude dist --exclude dist-ssr --exclude .git --exclude output --exclude .wrangler --exclude .playwright-cli --exclude .superpowers --exclude .claude --exclude docs --exclude .regressao "$R/" "$D/" || exit 1
ln -s "$R/node_modules" "$D/node_modules"
cd "$D" || exit 1
L="$D/build.log"; : > "$L"
npm run build >>"$L" 2>&1 || { echo "BUILD FALHOU ($1)"; tail -25 "$L"; exit 1; }
grep -E 'RNF|CSS|midia|imagens|audio|modelos|ESTOUROU' "$L"
node -e '
const fs=require("fs"),z=require("zlib");const h=fs.readFileSync("dist/index.html");
const js=fs.readdirSync("dist/assets").filter(f=>f.endsWith(".js"));
console.log("HTML",(h.length/1024).toFixed(1)+"K",(z.gzipSync(h,{level:9}).length/1024).toFixed(1)+"K gz | "+js.map(f=>{const c=fs.readFileSync("dist/assets/"+f);return f+" "+(c.length/1024).toFixed(1)+"K "+(z.gzipSync(c,{level:9}).length/1024).toFixed(1)+"K gz"}).join(" | "));
'
