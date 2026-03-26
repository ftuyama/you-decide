---
id: act4/throne_chains
title: Correntes vivas
chapter: 4
ambientTheme: explore
choices:
  - text: "Recolher um fragmento preso ao metal (−1 suprimento, +2 ouro)"
    next: act4/throne_gate
    condition: { resource: { supply: { gte: 1 } } }
    effects:
      - { op: addResource, resource: supply, delta: -1 }
      - { op: addResource, resource: gold, delta: 2 }
      - { op: addDiary, text: "Arranquei um caco ao osso do trono — o metal não perdoou, mas o bolso agradeceu." }
  - text: "Deixar o gotejar tocar na pele (+1 corrupção, −1 fé)"
    next: act4/throne_gate
    condition: { resource: { faith: { gte: 1 } } }
    effects:
      - { op: addResource, resource: corruption, delta: 1 }
      - { op: addResource, resource: faith, delta: -1 }
      - { op: addDiary, text: "Provei o gotejar: doce como promessa, e promessa sempre cobra juros." }
  - text: "Afastar as mãos e voltar"
    next: act4/throne_gate
onEnter: []
---
As correntes **querem** dedos. Não prendem só o trono — **ensaiam** o teu nome como quem experimenta uma corrente nova.
