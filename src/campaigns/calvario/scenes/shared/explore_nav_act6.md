---
id: shared/explore_nav_act6
title: Colunas da nave fraturada
chapter: 6
type: exploration
ambientTheme: void
choices:
  - id: explore_force
    text: "Forçar encontro (combate aleatório)"
    preview: "Sem mover no mapa — só violência."
  - id: explore_leave
    text: "Recuar para a nave fraturada"
    next: act6/hub_fractured_nave
    effects:
      - { op: clearAsciiMap }
    preview: "Sair do perímetro e manter o stress atual."
onEnter: []
---
Cada coluna repete um juramento quebrado. Caminhar aqui é escolher qual rachadura vai responder primeiro.
