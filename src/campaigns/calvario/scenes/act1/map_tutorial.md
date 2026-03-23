---
id: act1/map_tutorial
title: Tutorial do Mapa ASCII
chapter: 1
choices:
  - text: "Sair"
    next: act1/dungeon_mouth
onEnter:
  - { op: setAsciiMap, mapId: demo5, playerX: 1, playerY: 1 }
  - { op: addXp, amount: 5 }
---
Tutorial do **mapa ASCII** (opcional).