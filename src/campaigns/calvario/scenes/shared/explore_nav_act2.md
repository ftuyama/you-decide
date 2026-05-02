---
id: shared/explore_nav_act2
title: Perímetro dos túneis
chapter: 2
type: exploration
ambientTheme: explore
choices:
  - id: explore_leave
    text: "Retornar ao hub do cruzeiro"
    next: act2/hub_catacomb
    uiSection: "No perímetro"
    effects:
      - { op: clearAsciiMap }
    preview: "Recuar, erguer abrigo e manter o stress atual."
  - id: explore_patrol_random
    text: "Patrulhar ao acaso (encontro aleatório)"
    uiSection: "No perímetro"
    preview: "Sem mover no mapa — os túneis escolhem por ti."
    effects:
      - op: startWildEncounterFromGraph
        graphId: act2_catacomb
onEnter: []
---
O **silêncio** não é ausência de som — é **decisão** da pedra. Cada passo **pergunta** se voltas ao fogo da Vigília ou se **ficas** com o eco.

Com o **mapa rasgado**, vês onde o corredor **mente** menos; sem ele, só tens **pele** e **pressa**.
