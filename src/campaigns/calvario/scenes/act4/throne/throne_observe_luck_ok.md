---
id: act4/throne/throne_observe_luck_ok
title: Gota cativa
chapter: 4
ambientTheme: explore
choices:
  - text: "Continuar a observar o trono"
    next: act4/throne/throne_observe
    condition: { noFlag: throne_observe_drip_gold_done }
    effects:
      - { op: setFlag, key: throne_observe_drip_gold_done, value: true }
      - { op: addResource, resource: gold, delta: 1 }
      - { op: addDiary, text: "A gota solidificou-se entre os dedos — pequena moeda de gelo e sorte." }
  - text: "Voltar ao momento da decisão"
    next: act4/throne/throne_gate
onEnter: []
---
No instante certo, a **memória** engana-se e pensa que és dono dela. Aproveita: o trono ainda não percebeu.
