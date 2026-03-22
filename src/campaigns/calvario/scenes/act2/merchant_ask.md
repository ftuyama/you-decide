---
id: act2/merchant_ask
title: Origem
chapter: 2
choices:
  - text: "Aceitar o mapa (−1 ouro)"
    next: act2/hub_catacomb
    condition: { resource: { gold: { gte: 1 } } }
    effects:
      - { op: grantItem, itemId: rumor_map }
      - { op: addResource, resource: gold, delta: -1 }
  - text: "Recusar e voltar ao hub"
    next: act2/hub_catacomb
onEnter: []
---
"De um **arquivo** que já não existe", murmura. "O arquivo queimou. O **mapa** lembrou-se de sobreviver."

Por um segundo, o capuz **incha** — não há vento.
