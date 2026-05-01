---
id: act5/frost_merchant
chapter: 5
ambientTheme: merchant
artKey: merchant
title: Tenda do comerciante de geada
choices:
  - text: "Comprar Poção Rubra (5 ouro) (x2)"
    next: act5/frost_merchant
    condition:
      all:
        - { resource: { gold: { gte: 5 } } }
        - { noFlag: act5_merch_hp_1 }
    effects:
      - { op: addResource, resource: gold, delta: -5 }
      - { op: grantItem, itemId: potion_hp }
      - { op: setFlag, key: act5_merch_hp_1, value: true }
  - text: "Comprar Poção Rubra (5 ouro) (x1)"
    next: act5/frost_merchant
    condition:
      all:
        - { resource: { gold: { gte: 5 } } }
        - { flag: act5_merch_hp_1 }
        - { noFlag: act5_merch_hp_2 }
    effects:
      - { op: addResource, resource: gold, delta: -5 }
      - { op: grantItem, itemId: potion_hp }
      - { op: setFlag, key: act5_merch_hp_2, value: true }
  - text: "Comprar Tônico Azul (10 ouro) (x1)"
    next: act5/frost_merchant
    condition:
      all:
        - { resource: { gold: { gte: 10 } } }
        - { noFlag: act5_merch_mana_1 }
    effects:
      - { op: addResource, resource: gold, delta: -10 }
      - { op: grantItem, itemId: potion_mana }
      - { op: setFlag, key: act5_merch_mana_1, value: true }
  - text: "Comprar Hidromel (4 ouro) (x1)"
    next: act5/frost_merchant
    condition:
      all:
        - { resource: { gold: { gte: 4 } } }
        - { noFlag: act5_merch_stress_1 }
    effects:
      - { op: addResource, resource: gold, delta: -4 }
      - { op: grantItem, itemId: potion_stress }
      - { op: setFlag, key: act5_merch_stress_1, value: true }
  - text: "Comprar Suprimento (5 ouro) (x2)"
    next: act5/frost_merchant
    condition:
      all:
        - { resource: { gold: { gte: 5 } } }
        - { noFlag: act5_merch_supply_1 }
    effects:
      - { op: addResource, resource: gold, delta: -5 }
      - { op: addResource, resource: supply, delta: 1 }
      - { op: setFlag, key: act5_merch_supply_1, value: true }
  - text: "Comprar Suprimento (5 ouro) (x1)"
    next: act5/frost_merchant
    condition:
      all:
        - { resource: { gold: { gte: 5 } } }
        - { flag: act5_merch_supply_1 }
        - { noFlag: act5_merch_supply_2 }
    effects:
      - { op: addResource, resource: gold, delta: -5 }
      - { op: addResource, resource: supply, delta: 1 }
      - { op: setFlag, key: act5_merch_supply_2, value: true }
  - text: "Comprar Suprimento (10 ouro) (x1)"
    next: act5/frost_merchant
    condition:
      all:
        - { resource: { gold: { gte: 10 } } }
        - { level: { gte: 21 } }
        - { flag: act5_merch_supply_1 }
        - { flag: act5_merch_supply_2 }
        - { noFlag: act5_merch_supply_3 }
    effects:
      - { op: addResource, resource: gold, delta: -10 }
      - { op: addResource, resource: supply, delta: 1 }
      - { op: setFlag, key: act5_merch_supply_3, value: true }
  - text: "Comprar Último Suprimento (15 ouro) (x1)"
    next: act5/frost_merchant
    condition:
      all:
        - { resource: { gold: { gte: 15 } } }
        - { level: { gte: 25 } }
        - { flag: act5_merch_supply_1 }
        - { flag: act5_merch_supply_2 }
        - { flag: act5_merch_supply_3 }
        - { noFlag: act5_merch_supply_4 }
    effects:
      - { op: addResource, resource: gold, delta: -15 }
      - { op: addResource, resource: supply, delta: 1 }
      - { op: setFlag, key: act5_merch_supply_4, value: true }
  - text: "Afastar-me da tenda"
    next: act5/frost_hub
onEnter: []
---
Dentro da tenda, frascos **tremem** como línguas. O mercador não mostra rosto — só **preços** que não congelam. Cheira a **ervas** queimadas e a **medo** de quem precisa de remédio a meio de uma guerra com o céu.

> Estoque **limitado**. O vento cobra juros a quem **hesita** — e juros de verdade cobra a quem finge que não precisa de nada.
