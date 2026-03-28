---
id: act6/fractured_merchant
chapter: 6
ambientTheme: merchant
artKey: merchant
title: Banca do último preço
choices:
  - text: "Comprar Poção Rubra (8 ouro) — 1ª garrafa"
    next: act6/fractured_merchant
    condition:
      all:
        - { resource: { gold: { gte: 5 } } }
        - { noFlag: act6_merch_hp_1 }
    effects:
      - { op: addResource, resource: gold, delta: -5 }
      - { op: grantItem, itemId: potion_hp }
      - { op: setFlag, key: act6_merch_hp_1, value: true }
  - text: "Comprar Poção Rubra (5 ouro) — última garrafa"
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
  - text: "Comprar Tônico Azul (7 ouro) — única unidade"
    next: act6/fractured_merchant
    condition:
      all:
        - { resource: { gold: { gte: 7 } } }
        - { noFlag: act6_merch_mana_1 }
    effects:
      - { op: addResource, resource: gold, delta: -7 }
      - { op: grantItem, itemId: potion_mana }
      - { op: setFlag, key: act6_merch_mana_1, value: true }
  - text: "Comprar Infusão Serena (6 ouro) — única unidade"
    next: act6/fractured_merchant
    condition:
      all:
        - { resource: { gold: { gte: 6 } } }
        - { noFlag: act6_merch_stress_1 }
    effects:
      - { op: addResource, resource: gold, delta: -6 }
      - { op: grantItem, itemId: potion_stress }
      - { op: setFlag, key: act6_merch_stress_1, value: true }
  - text: "Comprar Suprimento (5 ouro) — única unidade"
    next: act6/fractured_merchant
    condition:
      all:
        - { resource: { gold: { gte: 5 } } }
        - { noFlag: act6_merch_supply_1 }
    effects:
      - { op: addResource, resource: gold, delta: -5 }
      - { op: addResource, resource: supply, delta: 1 }
      - { op: setFlag, key: act6_merch_supply_1, value: true }
  - text: "Afastar-me da banca"
    next: act6/hub_fractured_nave
onEnter: []
---
Sobre um pano que **não reflete** nada, frascos alinham-se como **dentes** em boca fechada. Quem vende não mostra **mãos** — só **preços** que sobem quando hesitas, porque aqui o **último** comprador já pagou com o que não tinha.

> Estoque **limitado**. O vazio **cobre** juros em ouro — e em **lembranças** que preferias ter deixado para trás.
