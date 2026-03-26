---
id: act4/throne_observe_luck_fail
title: Gota traída
chapter: 4
ambientTheme: explore
choices:
  - text: "Sacudir a mão e continuar a observar"
    next: act4/throne_observe
    effects:
      - { op: addResource, resource: supply, delta: -1 }
  - text: "Voltar ao momento da decisão"
    next: act4/throne_gate
onEnter: []
---
A gota **cai** onde não devia — **mancha** a manga, rouba calor, ri **sem dentes**.
