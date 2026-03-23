---
id: act4/late_merchant
chapter: 4
artKey: merchant
title: Mercador do trono
choices:
  - text: "Comprar Poção Rubra (14 ouro) — 1ª garrafa"
    next: act4/late_merchant
    condition:
      all:
        - { resource: { gold: { gte: 14 } } }
        - { noFlag: act4_merch_hp_1 }
    effects:
      - { op: addResource, resource: gold, delta: -14 }
      - { op: grantItem, itemId: potion_hp }
      - { op: setFlag, key: act4_merch_hp_1, value: true }
  - text: "Comprar Poção Rubra (14 ouro) — última garrafa"
    next: act4/late_merchant
    condition:
      all:
        - { resource: { gold: { gte: 14 } } }
        - { flag: act4_merch_hp_1 }
        - { noFlag: act4_merch_hp_2 }
    effects:
      - { op: addResource, resource: gold, delta: -14 }
      - { op: grantItem, itemId: potion_hp }
      - { op: setFlag, key: act4_merch_hp_2, value: true }
  - text: "Comprar Tônico Azul (18 ouro) — única unidade"
    next: act4/late_merchant
    condition:
      all:
        - { resource: { gold: { gte: 18 } } }
        - { noFlag: act4_merch_mana_1 }
    effects:
      - { op: addResource, resource: gold, delta: -18 }
      - { op: grantItem, itemId: potion_mana }
      - { op: setFlag, key: act4_merch_mana_1, value: true }
  - text: "Comprar Infusão Serena (12 ouro) — única unidade"
    next: act4/late_merchant
    condition:
      all:
        - { resource: { gold: { gte: 12 } } }
        - { noFlag: act4_merch_stress_1 }
    effects:
      - { op: addResource, resource: gold, delta: -12 }
      - { op: grantItem, itemId: potion_stress }
      - { op: setFlag, key: act4_merch_stress_1, value: true }
  - text: "Afastar-me do mercador"
    next: act4/throne_gate
onEnter: []
---
Entre **correntes** que não prendem, alguém **desdobra** um pano — frascos que **tremem** como se ainda tivessem **paciência**.

A voz não vem da **garganta**; vem do **eco** que já te conhece o nome.

> Estoque **limitado**. O trono **come** a memória, mas o **ouro** paga o silêncio.
