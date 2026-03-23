---
id: act1/pick_cleric
chapter: 1
artKey: pick_cleric
choices:
  - text: "Avançar para a boca da masmorra"
    next: act1/dungeon_mouth
    effects:
      - { op: initClass, class: cleric }
      - { op: addRep, faction: vigilia, delta: 1 }
onEnter: []
---
O emblema queima frio na palma. Palavras antigas repelhem o véu.
