---
id: act3/messenger_payoff
title: Inventário do morto
chapter: 3
ambientTheme: act3
choices:
  - text: "Deixar o broche e a lista onde a Vigília as encontrará"
    next: act3/hub_depths
    effects:
      - { op: setFlag, key: act3_messenger_done, value: true }
      - { op: addRep, faction: vigilia, delta: 1, directGain: true }
      - { op: addResource, resource: gold, delta: 2 }
      - { op: addXp, amount: 12 }
      - { op: addDiary, text: "Devolvi ao farol o que o culto roubou — sem glória, com renda." }
    preview: "Vigília +1 · pouco ouro · ordem agradece em silêncio."
  - text: "Passar o pacote ao Círculo — preço e anonimato"
    next: act3/hub_depths
    effects:
      - { op: setFlag, key: act3_messenger_done, value: true }
      - { op: addRep, faction: circulo, delta: 1, directGain: true }
      - { op: addResource, resource: gold, delta: 5 }
      - { op: addResource, resource: corruption, delta: 1 }
      - { op: addXp, amount: 12 }
      - { op: addDiary, text: "O Círculo paga melhor por segredo do que a Vigília por honra — e eu cobrei o juro na pele." }
    preview: "Círculo +1 · mais ouro · +1 corrupção"
onEnter: []
---
No coldre: **lista de nomes** com carimbo raspado e um **broche** de sentinela torto. Podes devolver à **ordem** ou transformar em **moeda** na rede — cada uma cobra um tipo de silêncio.
