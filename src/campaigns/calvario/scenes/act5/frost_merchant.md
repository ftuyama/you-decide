---
id: act5/frost_merchant
chapter: 5
artKey: merchant
title: Tenda do comerciante de geada
choices:
  - text: "Comprar Poção Rubra (16 ouro) — 1ª garrafa"
    next: act5/frost_merchant
    condition:
      all:
        - { resource: { gold: { gte: 16 } } }
        - { noFlag: act5_merch_hp_1 }
    effects:
      - { op: addResource, resource: gold, delta: -16 }
      - { op: grantItem, itemId: potion_hp }
      - { op: setFlag, key: act5_merch_hp_1, value: true }
  - text: "Comprar Poção Rubra (16 ouro) — última garrafa"
    next: act5/frost_merchant
    condition:
      all:
        - { resource: { gold: { gte: 16 } } }
        - { flag: act5_merch_hp_1 }
        - { noFlag: act5_merch_hp_2 }
    effects:
      - { op: addResource, resource: gold, delta: -16 }
      - { op: grantItem, itemId: potion_hp }
      - { op: setFlag, key: act5_merch_hp_2, value: true }
  - text: "Comprar Tônico Azul (20 ouro) — única unidade"
    next: act5/frost_merchant
    condition:
      all:
        - { resource: { gold: { gte: 20 } } }
        - { noFlag: act5_merch_mana_1 }
    effects:
      - { op: addResource, resource: gold, delta: -20 }
      - { op: grantItem, itemId: potion_mana }
      - { op: setFlag, key: act5_merch_mana_1, value: true }
  - text: "Comprar Infusão Serena (14 ouro) — única unidade"
    next: act5/frost_merchant
    condition:
      all:
        - { resource: { gold: { gte: 14 } } }
        - { noFlag: act5_merch_stress_1 }
    effects:
      - { op: addResource, resource: gold, delta: -14 }
      - { op: grantItem, itemId: potion_stress }
      - { op: setFlag, key: act5_merch_stress_1, value: true }
  - text: "Afastar-me da tenda"
    next: act5/frost_hub
onEnter: []
---
Dentro da tenda, frascos **tremem** como línguas. O mercador não mostra rosto — só **preços** que não congelam.

> Estoque **limitado**. O vento cobra juros a quem **hesita**.
