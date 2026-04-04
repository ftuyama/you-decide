---
id: act3/descent
title: Descida ao Calvário
chapter: 3
ambientTheme: act3
choices:
  - text: "Seguir até o poço"
    next: act3/well_lies
  - text: "Tentar o mapa (rumor)"
    next: act3/cult_passage
    condition:
      all:
        - { hasItem: rumor_map }
        - { level: { gte: 6 } }
  - text: "Mapa mini (exploração ASCII)"
    next: act3/ascii_explore
    condition: { level: { gte: 8 } }
  - text: "Evento de corrupção"
    next: act3/corruption_event
    condition: { level: { gte: 6 } }
  - text: "Nota no diário"
    next: act3/diary_trigger
    effects:
      - { op: addDiary, text: "O ar cheira a cobre podre." }
onEnter: []
---
A escada **afunda**. O pulso verde pulsa no tempo do teu coração.

Com o **Mapa Rasgado** no inventário, abre-se um atalho narrativo.
