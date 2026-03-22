---
id: act1/dungeon_door
title: Batentes
chapter: 1
choices:
  - text: "Entrar na catacumba"
    next: act2/catacomb_entry
    effects:
      - { op: setChapter, chapter: 2 }
      - { op: addResource, resource: supply, delta: -1 }
  - text: "Voltar ao último corredor (narrativa)"
    next: act1/dungeon_mouth
onEnter: []
---
Runas **apagadas** foram re-riscadas por mãos recentes. Entre elas, um **sino** rudimentar — o Terceiro Sino, dizem os rumores.

A madeira está húmida por **dentro**, como se a pedra respirasse.
