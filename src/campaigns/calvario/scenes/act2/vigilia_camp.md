---
id: act2/vigilia_camp
title: Acampamento da Vigília
chapter: 2
ambientTheme: camp
artKey: vigilia_camp
choices:
  - text: "Descansar no acampamento (−1 suprimento)"
    next: act2/hub_catacomb
    condition: { resource: { supply: { gte: 1 } } }
    effects:
      - { op: campRest }
  - text: "Beber poção rubra (ti)"
    next: act2/vigilia_camp
    condition: { hasItem: potion_hp }
    effects:
      - { op: useConsumable, itemId: potion_hp, targetIndex: 0 }
  - text: "Dar poção rubra ao companheiro"
    next: act2/vigilia_camp
    condition: { all: [{ hasItem: potion_hp }, { companionCount: { gte: 1 } }] }
    effects:
      - { op: useConsumable, itemId: potion_hp, targetIndex: 1 }
  - text: "Beber tônico azul (mana)"
    next: act2/vigilia_camp
    condition:
      all:
        - { hasItem: potion_mana }
        - { any: [{ class: mage }, { class: cleric }] }
    effects:
      - { op: useConsumable, itemId: potion_mana, targetIndex: 0 }
  - text: "Beber infusão serena (stress)"
    next: act2/vigilia_camp
    condition: { hasItem: potion_stress }
    effects:
      - { op: useConsumable, itemId: potion_stress, targetIndex: 0 }
  - text: "Trocar duas palavras com o grupo"
    next: act2/camp_companion_chat
    condition: { companionCount: { gte: 1 } }
  - text: "Manusear equipamento no acampamento"
    next: act2/manage_equip
  - text: "Continuar"
    next: act2/hub_catacomb
onEnter:
  - { op: addRep, faction: vigilia, delta: 1 }
---
Soldados da **Vigília** partilham pão seco. Honra tem gosto de cinza.

**Suprimento** aqui serve para **descansar**: recuperas HP e mana ao máximo e alivias 1 de stress (custa 1 suprimento).
