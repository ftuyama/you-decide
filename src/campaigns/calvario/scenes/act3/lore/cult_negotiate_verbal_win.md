---
id: act3/lore/cult_negotiate_verbal_win
title: Pacto sem altar (palavra)
chapter: 3
ambientTheme: act3
artKey: cult_negotiate
choices:
  - text: "Descer com o contrato na cabeça"
    next: act3/hub_depths
onEnter:
  - { op: setFlag, key: act3_negotiate_done, value: true }
  - { op: addRep, faction: circulo, delta: 1 }
  - { op: addRep, faction: vigilia, delta: -1 }
  - { op: addResource, resource: gold, delta: 2 }
  - { op: addDiary, text: "[RASCUNHO] O encarregado fechou o tom sem altar — barganha em voz mínima; o cano adiou o dente." }
---
[RASCUNHO] O encarregado recua meio passo. A moeda desaparece na manga como quem guarda saldo. O contrato ficou **dito** — o túnel continua a pedir prova, mas não **nesta** dobra.
