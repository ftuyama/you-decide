---
id: act4/morvayn_parley
title: Parlamento com Morvayn
chapter: 4
ambientTheme: explore
artKey: morvayn
choices:
  - text: "Recusar o pacto e lutar"
    next: act4/encounters/fight_morvayn
    effects:
      - { op: addRep, faction: vigilia, delta: 1, directGain: true }
  - text: "Aceitar servir ao Terceiro Sino"
    next: act4/pact/pact_ascent
    condition: { rep: { faction: culto, gte: 2 } }
    showWhenLocked: true
    lockedHint: "O Terceiro Sino só estende a mão a quem o Culto ainda não trata como inimigo declarado."
    preview: "Corrupção e poder sombrio."
  - text: "Tentar selar a masmorra (sacrifício)"
    next: act4/seal_ending
    condition: { resource: { faith: { gte: 2 } } }
    showWhenLocked: true
    lockedHint: "Precisas de pelo menos 2 medidas de fé para arriscar o selo — convicção apertada."
onEnter: []
---
"A paz é **silêncio**", diz Morvayn. "Escolhe o silêncio que preferes ouvir."
