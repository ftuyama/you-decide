---
id: act4/throne_sweep_cat_fail
title: Contagem que foge
chapter: 4
choices:
  - text: "À segunda fase — trono!"
    next: act4/fight_morvayn_2
onEnter:
  - { op: addResource, resource: corruption, delta: 1 }
  - { op: addDiary, text: "Perdi a conta e o trono acrescentou uma linha ao meu medo." }
---
O osso **multiplica-se** quando não olhas — não é truque, é **pedagogia** cruel.
