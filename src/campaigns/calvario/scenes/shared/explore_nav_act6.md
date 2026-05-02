---
id: shared/explore_nav_act6
title: Colunas da nave fraturada
chapter: 6
type: exploration
ambientTheme: void
choices:
  - id: explore_leave
    text: "Recuar para a nave fraturada"
    next: act6/hub_fractured_nave
    uiSection: "No perímetro"
    effects:
      - { op: clearAsciiMap }
    preview: "Sair do perímetro e manter o stress atual."
  - id: explore_patrol_random
    text: "Vagar entre as colunas (encontro aleatório)"
    uiSection: "No perímetro"
    preview: "Sem mover no mapa — o vazio escolhe o próximo passo."
    effects:
      - op: startWildEncounterFromGraph
        graphId: act6_fractured_nave
onEnter: []
---
Cada coluna repete um juramento quebrado. Caminhar aqui é escolher qual rachadura vai responder primeiro.
