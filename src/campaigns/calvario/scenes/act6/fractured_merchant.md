---
id: act6/fractured_merchant
chapter: 6
ambientTheme: merchant
artKey: merchant
title: Banca do último preço
choices:
  - text: "Comprar planta da nave (−4 ouro)"
    uiSection: "À venda"
    next: act6/fractured_merchant
    condition:
      all:
        - { resource: { gold: { gte: 4 } } }
        - { noItem: fractured_nave_map }
    effects:
      - { op: grantItem, itemId: fractured_nave_map }
      - { op: addResource, resource: gold, delta: -4 }
  - text: "Comprar Poção Rubra (8 ouro) (x2)"
    uiSection: "À venda"
    next: act6/fractured_merchant
    condition:
      all:
        - { resource: { gold: { gte: 5 } } }
        - { noFlag: act6_merch_hp_1 }
    effects:
      - { op: addResource, resource: gold, delta: -5 }
      - { op: grantItem, itemId: potion_hp }
      - { op: setFlag, key: act6_merch_hp_1, value: true }
  - text: "Comprar Poção Rubra (5 ouro) (x1)"
    uiSection: "À venda"
    next: act6/fractured_merchant
    condition:
      all:
        - { resource: { gold: { gte: 5 } } }
        - { flag: act6_merch_hp_1 }
        - { noFlag: act6_merch_hp_2 }
    effects:
      - { op: addResource, resource: gold, delta: -5 }
      - { op: grantItem, itemId: potion_hp }
      - { op: setFlag, key: act6_merch_hp_2, value: true }
  - text: "Comprar Tônico Azul (7 ouro) (x1)"
    uiSection: "À venda"
    next: act6/fractured_merchant
    condition:
      all:
        - { resource: { gold: { gte: 7 } } }
        - { noFlag: act6_merch_mana_1 }
    effects:
      - { op: addResource, resource: gold, delta: -7 }
      - { op: grantItem, itemId: potion_mana }
      - { op: setFlag, key: act6_merch_mana_1, value: true }
  - text: "Comprar Hidromel (6 ouro) (x1)"
    uiSection: "À venda"
    next: act6/fractured_merchant
    condition:
      all:
        - { resource: { gold: { gte: 6 } } }
        - { noFlag: act6_merch_stress_1 }
    effects:
      - { op: addResource, resource: gold, delta: -6 }
      - { op: grantItem, itemId: potion_stress }
      - { op: setFlag, key: act6_merch_stress_1, value: true }
  - text: "Comprar Suprimento (5 ouro) (x2)"
    uiSection: "À venda"
    next: act6/fractured_merchant
    condition:
      all:
        - { resource: { gold: { gte: 5 } } }
        - { noFlag: act6_merch_supply_1 }
    effects:
      - { op: addResource, resource: gold, delta: -5 }
      - { op: addResource, resource: supply, delta: 1 }
      - { op: setFlag, key: act6_merch_supply_1, value: true }
  - text: "Comprar Suprimento (5 ouro) (x1)"
    uiSection: "À venda"
    next: act6/fractured_merchant
    condition:
      all:
        - { resource: { gold: { gte: 5 } } }
        - { flag: act6_merch_supply_1 }
        - { noFlag: act6_merch_supply_2 }
    effects:
      - { op: addResource, resource: gold, delta: -5 }
      - { op: addResource, resource: supply, delta: 1 }
      - { op: setFlag, key: act6_merch_supply_2, value: true }
  - text: "Comprar Suprimento (10 ouro) (x1)"
    uiSection: "À venda"
    next: act6/fractured_merchant
    condition:
      all:
        - { resource: { gold: { gte: 10 } } }
        - { level: { gte: 31 } }
        - { flag: act6_merch_supply_1 }
        - { flag: act6_merch_supply_2 }
        - { noFlag: act6_merch_supply_3 }
    effects:
      - { op: addResource, resource: gold, delta: -10 }
      - { op: addResource, resource: supply, delta: 1 }
      - { op: setFlag, key: act6_merch_supply_3, value: true }
  - text: "Afastar-me da banca"
    uiSection: "Conversa"
    next: act6/hub_fractured_nave
onEnter: []
---
Sobre um pano que **não reflete** nada, frascos alinham-se como **dentes** em boca fechada. Quem vende não mostra **mãos** — só **preços** que sobem quando hesitas, porque aqui o **último** comprador já pagou com o que não tinha.

> Estoque **limitado**. O vazio **cobre** juros em ouro — e em **lembranças** que preferias ter deixado para trás.
