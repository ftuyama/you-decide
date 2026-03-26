---
id: act2/merchant_moon
chapter: 2
ambientTheme: merchant
artKey: merchant
title: Mercador sem rosto
choices:
  - text: "Aceitar o mapa rasgado (−1 ouro)"
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
  - text: "Recusar educadamente"
    next: act2/hub_catacomb
  - text: "Perguntar de onde veio o mapa"
    next: act2/merchant_ask
  - text: "Mencionar patrulhas da Vigília (aliados)"
    next: act2/hub_catacomb
    condition: { rep: { faction: vigilia, gte: 2 } }
    effects:
      - { op: addDiary, text: "O mercador hesitou quando falei da Vigília — interesse compra silêncio." }
    preview: "Diário · rumor de respeito"
  - text: "Sussurrar símbolos do Círculo"
    next: act2/merchant_circle_bet
    condition: { rep: { faction: circulo, gte: 1 } }
    preview: "Teste de sorte · aposta amaldiçoada"
  - text: "Deixar o Terceiro Sino nomear o preço"
    next: act2/hub_catacomb
    condition: { rep: { faction: culto, gte: 1 } }
    effects:
      - { op: addResource, resource: corruption, delta: 1 }
      - { op: addDiary, text: "Uma risada seca sob o tecido — o culto gosta de quem já ouve o mesmo eco." }
    preview: "+1 corrupção, diário"
onEnter: []
---
Um capuz **sem rosto** estende um **mapa** com margens roídas. Os dedos por baixo do tecido são **demasiado longos** para serem só humanos.

"Rumores mudam **pesos**", diz a voz — como se o ar saísse da própria pedra.

Se alguém te **reconhece** nas facções, o preço deixa de ser só ouro — torna-se **olhar**.
