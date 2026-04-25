---
id: act3/descent
title: Descida ao silêncio profundo
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
    showWhenLocked: true
    lockedHint: "Precisas do mapa-rumor no inventário e de nível 6 para forçar esse atalho."
  - text: "Mapa mini (exploração ASCII)"
    next: act3/ascii_explore
    condition: { level: { gte: 8 } }
    showWhenLocked: true
    lockedHint: "Só com nível 8 o subsolo deixa-te ler esse mapa como território."
  - text: "Evento de corrupção"
    next: act3/corruption_event
    condition: { level: { gte: 6 } }
    showWhenLocked: true
    lockedHint: "Com nível 6 a corrupção deixa de ser só rumor — torna-se encontro."
  - text: "Nota no diário"
    next: act3/diary_trigger
    effects:
      - { op: addDiary, text: "O ar cheira a cobre podre." }
onEnter: []
---
A escada **afunda** e o pulso verde bate com o teu coração — por baixo, túneis são também **tratos** entre facções. Cada lance rouba um fio de **ruído** até restar só o ritmo da pedra e o teu.

Com o **Mapa Rasgado**, abre-se um atalho que o mapa comum não mostra.
