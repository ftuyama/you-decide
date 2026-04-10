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
  - text: "Denunciar uma marca do Culto ao oficial (−1 culto)"
    condition:
      all:
        - { rep: { faction: vigilia, gte: 1 } }
        - { rep: { faction: culto, gte: 0 } }
        - { noFlag: vigilia_camp_denounce_cult_done }
    next: act2/camp/vigilia_camp
    effects:
      - { op: setFlag, key: vigilia_camp_denounce_cult_done, value: true }
      - { op: addRep, faction: culto, delta: -1, directGain: true }
      - { op: addRep, faction: vigilia, delta: 1 }
      - { op: addDiary, text: "Falei alto demais sobre o Terceiro Sino — o oficial anotou como vitória pequena." }
    preview: "Troca de reputação · Vigília lenta, Culto imediato (uma vez)"
  - text: "Continuar"
    next: act2/hub_catacomb
    effects:
      - { op: advanceDay }
onEnter:
  - { op: addRep, faction: vigilia, delta: 1 }
---
Soldados da **Vigília** partilham pão seco. Honra tem gosto de cinza.

*Sem sol de referência, a pedra regista na mesma: **dia {{day}}**.*
