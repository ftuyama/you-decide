---
id: act4/throne/throne_observe_mind_fail
title: Letra presa
chapter: 4
ambientTheme: explore
choices:
  - text: "Desistir da leitura e continuar a observar"
    next: act4/throne/throne_observe
    condition: { noFlag: throne_observe_mind_fail_corruption_done }
    effects:
      - { op: setFlag, key: throne_observe_mind_fail_corruption_done, value: true }
      - { op: addResource, resource: corruption, delta: 1 }
  - text: "Voltar ao momento da decisão"
    next: act4/throne/throne_gate
onEnter: []
---
A letra **escapa** e deixa um **zumbido** onde devia haver sentido. O trono gosta de **buracos** — tu acabaste de pagar um.
