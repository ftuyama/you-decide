---
id: act2/merchant_ask
title: Origem
chapter: 2
choices:
  - text: "Aceitar o mapa (−1 ouro)"
    next: act2/hub_catacomb
    condition:
      all:
        - { resource: { gold: { gte: 1 } } }
        - { noItem: rumor_map }
    effects:
      - { op: grantItem, itemId: rumor_map }
      - { op: addResource, resource: gold, delta: -1 }
  - text: "Comprar adaga de ferro (−3 ouro)"
    next: act2/hub_catacomb
    condition:
      all:
        - { resource: { gold: { gte: 3 } } }
        - { noItem: iron_dagger }
    effects:
      - { op: grantItem, itemId: iron_dagger }
      - { op: addResource, resource: gold, delta: -3 }
    preview: "Arma · para o inventário"
  - text: "Recusar e voltar ao hub"
    next: act2/hub_catacomb
onEnter: []
---
"De um **arquivo** que já não existe", murmura. "O arquivo queimou. O **mapa** lembrou-se de sobreviver."

Por um segundo, o capuz **incha** — não há vento.
