---
id: act3/stone_niche_loot
title: Nicho Votivo
chapter: 3
ambientTheme: act3
artKey: votive_niche
onEnter:
  - { op: addResource, resource: gold, delta: 8 }
  - { op: setFlag, key: stone_niche_looted, value: true }
  - { op: addDiary, text: "Raspei moedas antigas de um nicho votivo antes que o po as engolisse de novo." }
choices:
  - text: "Guardar as moedas e voltar"
    next: act3/stone_corridor
---
Entre duas placas funerarias, encontras um nicho com moedas frias e resina seca. O altar protesta em silencio, mas nao o bastante para te parar.
