---
id: shared/explore_nav_act6
title: Colunas da nave fraturada
chapter: 6
type: exploration
ambientTheme: void
choices:
  - id: explore_patrol_random
    text: "Vagar entre as colunas (encontro aleatório)"
    uiSection: "No perímetro"
    preview: "Sem mover no mapa — o vazio escolhe o próximo passo."
    effects:
      - op: startWildEncounterFromGraph
        graphId: act6_fractured_nave
  - id: explore_dimensional_smith_route
    text: "Seguir o som do martelo sem forja"
    uiSection: "No perímetro"
    next: act6/dimensional_smith/entry
    condition:
      all:
        - { flag: act6_reality_done }
        - { level: { gte: 27 } }
        - { noFlag: act6_dimensional_smith_unlocked }
    preview: "Uma rota lateral; o eco bate no osso."
  - id: explore_leave
    text: "Recuar para a nave fraturada"
    next: act6/hub_fractured_nave
    uiSection: "No perímetro"
    effects:
      - { op: clearAsciiMap }
    preview: "Sair do perímetro e manter o stress atual."
onEnter: []
---
Cada coluna repete um juramento quebrado. Caminhar aqui é escolher qual rachadura vai responder primeiro.
