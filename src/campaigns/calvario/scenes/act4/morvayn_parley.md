---
id: act4/morvayn_parley
chapter: 4
choices:
  - text: "Recusar o pacto e lutar"
    next: act4/fight_morvayn
    effects:
      - { op: addRep, faction: vigilia, delta: 1 }
  - text: "Aceitar servir ao Terceiro Sino"
    next: act4/pact_ascent
    condition: { rep: { faction: culto, gte: 0 } }
    preview: "Corrupção e poder sombrio."
  - text: "Tentar selar o Calvário (sacrifício)"
    next: act4/seal_ending
    condition: { resource: { faith: { gte: 2 } } }
onEnter: []
---
"A paz é **silêncio**", diz Morvayn. "Escolhe o silêncio que preferes ouvir."