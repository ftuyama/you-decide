---
id: act1/dungeon_door
title: Batentes
chapter: 1
ambientTheme: explore
artKey: dungeon_mouth
highlight: true
artHighlightFrames:
  - dungeon_mouth_hl0
  - dungeon_mouth_hl1
  - dungeon_mouth_hl2
  - dungeon_mouth_hl3
  - dungeon_mouth_hl4
highlightHoldMs: 4000
choices:
  - text: "Entrar na catacumba"
    next: act2/catacomb_entry
    effects:
      - { op: setChapter, chapter: 2 }
      - { op: addResource, resource: supply, delta: -1 }
  - text: "Inclinar-se para o brilho do bronze nos batentes — ver-te"
    next: act1/mirror_door
  - text: "Voltar ao último corredor (narrativa)"
    next: act1/dungeon_mouth
onEnter: []
---
Runas **apagadas** foram re-riscadas por mãos recentes. Entre elas, um **sino** rudimentar — o Terceiro Sino, dizem os rumores.

A madeira está húmida por **dentro**, como se a pedra respirasse.
