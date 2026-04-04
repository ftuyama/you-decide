---
id: act4/throne/throne_sweep_cat_fail
title: Contagem que foge
chapter: 4
ambientTheme: explore
artKey: throne_sweep
choices:
  - text: "À segunda fase — trono!"
    next: act4/encounters/fight_morvayn_2
onEnter:
  - { op: addResource, resource: corruption, delta: 1 }
  - { op: addDiary, text: "Perdi a conta e o trono acrescentou uma linha ao meu medo." }
---
O osso **multiplica-se** quando não olhas — não é truque, é **pedagogia** cruel.
