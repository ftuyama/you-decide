---
id: act1/dungeon_mouth
title: Boca da masmorra
chapter: 1
artKey: dungeon_mouth
choices:
  - text: "Entrar na catacumba"
    next: act2/catacomb_entry
    effects:
      - { op: setChapter, chapter: 2 }
      - { op: addResource, resource: supply, delta: -1 }
  - text: "Inspeccionar os batentes da porta"
    next: act1/dungeon_door
onEnter: []
---
A **boca de pedra** range como mandíbula velha. O ar torna-se **denso**, como lã molhada a entrar pelos pulmões.

Do interior vem um cheiro: **terra**, **cinza**, e algo doce demais para ser saudável.
