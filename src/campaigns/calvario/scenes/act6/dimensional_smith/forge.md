---
id: act6/dimensional_smith/forge
title: Oficina Dimensional
chapter: 6
ambientTheme: merchant
artKey: dimensional_smith
choices:
  - text: "Temperar Adaga de Ferro (10 ouro)"
    uiSection: "Melhoria de ferro"
    next: act6/dimensional_smith/forge
    showWhenLocked: true
    lockedHint: "Requer Adaga de Ferro, 10 ouro e não possuir versão temperada."
    condition:
      all:
        - { hasItem: iron_dagger }
        - { noItem: iron_dagger_tempered }
        - { resource: { gold: { gte: 10 } } }
    effects:
      - { op: addResource, resource: gold, delta: -10 }
      - { op: grantItem, itemId: iron_dagger_tempered }
  - text: "Reforjar Espada Enferrujada (12 ouro)"
    uiSection: "Melhoria de ferro"
    next: act6/dimensional_smith/forge
    showWhenLocked: true
    lockedHint: "Requer Espada Enferrujada, 12 ouro e não possuir versão reforjada."
    condition:
      all:
        - { hasItem: rusty_sword }
        - { noItem: rusty_sword_reforged }
        - { resource: { gold: { gte: 12 } } }
    effects:
      - { op: addResource, resource: gold, delta: -12 }
      - { op: grantItem, itemId: rusty_sword_reforged }
  - text: "Forjar Armadura de Guarda Dimensional (Ferro de Fratura + Escória do Vazio)"
    uiSection: "Forja do vazio"
    next: act6/dimensional_smith/forge
    showWhenLocked: true
    lockedHint: "Requer 1 Ferro de Fratura, 1 Escória do Vazio e não possuir a armadura."
    condition:
      all:
        - { hasItem: act6_fracture_iron }
        - { hasItem: act6_void_slag }
        - { noItem: dimensional_ward_plate }
    effects:
      - { op: removeItem, itemId: act6_fracture_iron }
      - { op: removeItem, itemId: act6_void_slag }
      - { op: grantItem, itemId: dimensional_ward_plate }
      - { op: addDiary, text: "A armadura da guarda dimensional saiu da forja como se lembrasse meu nome." }
  - text: "Sair da oficina"
    uiSection: "Conversa"
    next: act6/hub_fractured_nave
onEnter: []
---
O teto da oficina respira torto. Sem fogo visível.

O ferreiro não sorri. Só mede tua respiração entre golpes.

"**Ferro vive. Ouro cala.**"

"Quer milagre? Traz sobra de encontro. Eu junto as partes."
