---
id: shared/explore_nav
title: Perímetro dos túneis
chapter: 2
type: exploration
ambientTheme: explore
choices:
  - id: explore_force
    text: "Forçar encontro (combate aleatório)"
    preview: "Sem mover no mapa — só violência."
  - id: explore_leave
    text: "Montar acampamento no cruzeiro"
    next: act2/hub_catacomb
    effects:
      - { op: clearAsciiMap }
    preview: "Recuar, erguer abrigo e manter o stress atual."
onEnter: []
---
O **silêncio** não é ausência de som — é **decisão** da pedra. Cada passo **pergunta** se voltas ao fogo da Vigília ou se **ficas** com o eco.

Com o **mapa rasgado**, vês onde o corredor **mente** menos; sem ele, só tens **pele** e **pressa**.
