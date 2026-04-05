---
id: act2/camp/vigilia_camp
title: Acampamento da Vigília
chapter: 2
ambientTheme: camp
artKey: vigilia_camp
campCombatHint: true
choices:
  - text: "Descansar no acampamento (−1 suprimento)"
    next: act2/hub_catacomb
    condition: { resource: { supply: { gte: 1 } } }
    effects:
      - { op: campRest }
      - { op: advanceDay }
  - text: "Beber poção rubra (ti)"
    next: act2/camp/vigilia_camp
    condition: { hasItem: potion_hp }
    effects:
      - { op: useConsumable, itemId: potion_hp, targetIndex: 0 }
  - text: "Dar poção rubra ao companheiro"
    next: act2/camp/vigilia_camp
    condition: { all: [{ hasItem: potion_hp }, { companionCount: { gte: 1 } }] }
    effects:
      - { op: useConsumable, itemId: potion_hp, targetIndex: 1 }
  - text: "Beber tônico azul (mana)"
    next: act2/camp/vigilia_camp
    condition:
      all:
        - { hasItem: potion_mana }
        - { any: [{ class: mage }, { class: cleric }] }
    effects:
      - { op: useConsumable, itemId: potion_mana, targetIndex: 0 }
  - text: "Beber infusão serena (stress)"
    next: act2/camp/vigilia_camp
    condition: { hasItem: potion_stress }
    effects:
      - { op: useConsumable, itemId: potion_stress, targetIndex: 0 }
  - text: "Trocar duas palavras com o grupo"
    next: act2/camp/camp_companion_chat
    condition: { companionCount: { gte: 1 } }
  - text: "Perguntar ao grupo há quantos dias desceste"
    next: act2/camp/camp_companion_chat
    condition: { all: [{ companionCount: { gte: 1 } }, { day: { gte: 4 } }] }
    preview: "Contagem em voz alta; o eco não mente."
  - text: "Riscar o dia na terra húmida"
    next: act2/camp/vigilia_camp
    preview: "Um registo no diário."
    effects:
      - { op: addDiary, text: "Riscaste na terra o dia {{day}}. O relógio de cima já não manda." }
  - text: "Manusear equipamento no acampamento"
    next: act2/camp/manage_equip
  - text: "Continuar"
    next: act2/hub_catacomb
    effects:
      - { op: advanceDay }
onEnter:
  - { op: addRep, faction: vigilia, delta: 1 }
---
Soldados da **Vigília** partilham pão seco. Honra tem gosto de cinza.

*Sem sol de referência, a pedra regista na mesma: **dia {{day}}**.*
