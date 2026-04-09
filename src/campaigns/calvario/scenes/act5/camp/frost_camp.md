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
  - text: "Partilhar uma prece com devotos do Terceiro Sino"
    condition: { rep: { faction: culto, gte: 2 } }
    next: act5/camp/frost_camp
    effects:
      - { op: addResource, resource: faith, delta: 1 }
      - { op: addResource, resource: corruption, delta: 1 }
      - { op: addDiary, text: "As brasas desenharam um sino invisível — ninguém tocou, mas todos ouviram." }
    preview: "+1 fé, +1 corrupção"
  - text: "Pedir escolta de pensamento à Vigília (contra o Culto)"
    condition:
      all:
        - { rep: { faction: vigilia, gte: 2 } }
        - { rep: { faction: culto, gte: 0 } }
    next: act5/camp/frost_camp
    effects:
      - { op: addRep, faction: culto, delta: -1, directGain: true }
      - { op: addRep, faction: vigilia, delta: 1 }
      - { op: addDiary, text: "Um capeador desenhou uma linha na neve entre mim e o rumor do sino." }
    preview: "Culto cai; Vigília sobe (lento)"
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
