---
id: act5/camp/frost_camp
title: Brasas sob a tempestade
chapter: 5
ambientTheme: camp
artKey: frost_camp
campCombatHint: true
choices:
  - text: "Descansar junto ao fogareiro (−1 suprimento)"
    next: act5/frost_hub
    condition: { resource: { supply: { gte: 1 } } }
    effects:
      - { op: campRest }
      - { op: advanceDay }
  - text: "Beber poção rubra (ti)"
    next: act5/camp/frost_camp
    condition: { hasItem: potion_hp }
    effects:
      - { op: useConsumable, itemId: potion_hp, targetIndex: 0 }
  - text: "Dar poção rubra ao companheiro"
    next: act5/camp/frost_camp
    condition: { all: [{ hasItem: potion_hp }, { companionCount: { gte: 1 } }] }
    effects:
      - { op: useConsumable, itemId: potion_hp, targetIndex: 1 }
  - text: "Beber tônico azul (mana)"
    next: act5/camp/frost_camp
    condition:
      all:
        - { hasItem: potion_mana }
        - { any: [{ class: mage }, { class: cleric }] }
    effects:
      - { op: useConsumable, itemId: potion_mana, targetIndex: 0 }
  - text: "Beber infusão serena (stress)"
    next: act5/camp/frost_camp
    condition: { hasItem: potion_stress }
    effects:
      - { op: useConsumable, itemId: potion_stress, targetIndex: 0 }
  - text: "Trocar duas palavras com o grupo"
    next: act5/camp/frost_companion_chat
    condition: { companionCount: { gte: 1 } }
  - text: "Manusear equipamento no acampamento"
    next: act5/camp/manage_equip
  - text: "Continuar"
    next: act5/frost_hub
    effects:
      - { op: advanceDay }
onEnter:
  - { op: addRep, faction: culto, delta: 1 }
---
Peregrinos e **forasteiros** partilham o que não têm: calor em **pedaços**. O fogo não julga — só **consome**. Entre duas histórias, a verdade é sempre a mesma: **ninguém** sobe inteiro.

*A tempestade não traz calendário — contas na mesma pedra: **dia {{day}}**.*.

Se o vento parar de sussurrar, desconfia: às vezes o silêncio é só **emboscada** a afinar o arco.
