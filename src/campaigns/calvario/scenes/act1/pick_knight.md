---
id: act1/pick_knight
title: Juramento do Cavaleiro
chapter: 1
ambientTheme: explore
artKey: pick_knight
choices:
  - text: "Avançar para a boca da masmorra"
    next: act1/dungeon_mouth
    effects:
      - { op: initClass, class: knight }
      - { op: addRep, faction: vigilia, delta: 1 }
onEnter: []
---
O metal obedece. A **Ordem da Vigília** sussurra aprovação nas dobras da couraça.
