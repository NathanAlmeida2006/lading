#!/usr/bin/env python3
"""Gera o wordmark LITHIUM em contornos convertidos, a partir da Secundaria.

Historico curto e util: a assinatura era a Fonte Marca (ArtDystopia II), passou
pela Principal de Suporte (Grenze Gotisch) quando a Marca saiu, e agora e a
Secundaria (Big Shoulders Display), por decisao do gerente do projeto em
05/09/2026.

Uma familia so, em muitos pesos e escalas, e o primeiro dos quatro principios
que a engenharia reversa do Burocratik manda importar. E com a Suporte fora, a
peca fica em DUAS familias: a Secundaria assina e anuncia, a Terciaria explica.

Continua saindo em SVG de contornos, e nao texto vivo, porque o RF-G04 exige
que a assinatura seja identica em toda peca.

A fonte e variavel (wght 100-900); o wordmark e instanciado em 800, o peso do
token h1.
"""
import sys
from pathlib import Path

from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

PALAVRA = "LITHIUM"
PESO = 800
TRACKING = 0.02  # +2%, o tracking do token h1


def wordmark(origem: Path, destino: Path) -> None:
    fonte = TTFont(str(origem))
    if "fvar" in fonte:
        fonte = instancer.instantiateVariableFont(fonte, {"wght": PESO})

    upm = fonte["head"].unitsPerEm
    cmap = fonte.getBestCmap()
    hmtx = fonte["hmtx"]
    glifos = fonte.getGlyphSet()

    avanco = 0
    partes = []
    caixa = None
    extra = int(upm * TRACKING)

    for letra in PALAVRA:
        nome = cmap[ord(letra)]
        # Coordenadas inteiras: em upm 1000 a precisao decimal nao aparece
        # em tela e custava 6 KB no arquivo inline.
        caneta = SVGPathPen(glifos, ntos=lambda v: str(round(v)))
        glifos[nome].draw(caneta)
        d = caneta.getCommands()
        if d:
            partes.append(f'<path transform="translate({avanco} 0)" d="{d}"/>')
            limites = BoundsPen(glifos)
            glifos[nome].draw(limites)
            if limites.bounds:
                x0, y0, x1, y1 = limites.bounds
                atual = (x0 + avanco, y0, x1 + avanco, y1)
                caixa = atual if caixa is None else (
                    min(caixa[0], atual[0]), min(caixa[1], atual[1]),
                    max(caixa[2], atual[2]), max(caixa[3], atual[3]))
        avanco += hmtx[nome][0] + extra

    if caixa is None:
        raise SystemExit(f"wordmark.py: nenhum contorno desenhado para {PALAVRA}")

    x0, y0, x1, y1 = caixa
    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" '
        f'viewBox="0 0 {x1 - x0:.0f} {y1 - y0:.0f}" '
        f'role="img" aria-label="{PALAVRA}" fill="currentColor">'
        f'<g transform="translate({-x0:.0f} {y1:.0f}) scale(1 -1)">{"".join(partes)}</g>'
        f"</svg>"
    )
    destino.write_text(svg, encoding="utf-8")
    fonte.close()
    print(f"  wordmark.py  {destino.name} {destino.stat().st_size // 1024} KB")


if __name__ == "__main__":
    wordmark(Path(sys.argv[1]), Path(sys.argv[2]))
