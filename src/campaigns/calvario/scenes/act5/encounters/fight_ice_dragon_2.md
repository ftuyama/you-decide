---
id: act5/encounters/fight_ice_dragon_2
title: Silêncio de Gelo
chapter: 5
ambientTheme: act5
choices:
  - text: "Beber poção rubra (ti)"
    next: act5/encounters/fight_ice_dragon_2
    condition: { hasItem: potion_hp }
    effects:
      - { op: useConsumable, itemId: potion_hp, targetIndex: 0 }
  - text: "Dar poção rubra ao companheiro"
    next: act5/encounters/fight_ice_dragon_2
    condition: { all: [{ hasItem: potion_hp }, { companionCount: { gte: 1 } }] }
    effects:
      - { op: useConsumable, itemId: potion_hp, targetIndex: 1 }
  - text: "Beber tônico azul (mana)"
    next: act5/encounters/fight_ice_dragon_2
    condition:
      all:
        - { hasItem: potion_mana }
        - { any: [{ class: mage }, { class: cleric }] }
    effects:
      - { op: useConsumable, itemId: potion_mana, targetIndex: 0 }
  - text: "Beber infusão serena (stress)"
    next: act5/encounters/fight_ice_dragon_2
    condition: { hasItem: potion_stress }
    effects:
      - { op: useConsumable, itemId: potion_stress, targetIndex: 0 }
  - text: "Segunda fase — partir o coração da geada"
    effects:
      - op: startCombat
        encounterId: boss_ice_dragon_2
        onVictory: act5/frost_epilogue
        onDefeat: act4/game_over
onEnter: []
---
O dragão **rasga** o próprio rugido e deixa entrar um **silêncio** pior que o barulho.

No peito dele, algo **pulsa** — não sangue, mas uma **nota** presa, como um sino fundido ao osso.

Se o partires, o Terceiro Sino ouve — ou **cala** para sempre.
