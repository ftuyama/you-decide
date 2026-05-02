---
id: act5/camp/frost_camp
title: Brasas sob a tempestade
chapter: 5
ambientTheme: camp
artKey: frost_camp
campCombatHint: true
choices:
  - text: "Descansar junto ao fogareiro (−1 suprimento)"
    uiSection: "Recuperar"
    next: act5/frost_hub
    condition: { resource: { supply: { gte: 1 } } }
    showWhenLocked: true
    lockedHint: "Precisas de pelo menos 1 suprimento para pagar o descanso."
    effects:
      - { op: campRest }
      - { op: advanceDay }
  - text: "Beber poção rubra (ti)"
    uiSection: "Recuperar"
    next: act5/camp/frost_camp
    condition: { hasItem: potion_hp }
    effects:
      - { op: useConsumable, itemId: potion_hp, targetIndex: 0 }
  - text: "Dar poção rubra ao companheiro"
    uiSection: "Recuperar"
    next: act5/camp/frost_camp
    condition: { all: [{ hasItem: potion_hp }, { companionCount: { gte: 1 } }] }
    effects:
      - { op: useConsumable, itemId: potion_hp, targetIndex: 1 }
  - text: "Beber tônico azul (mana)"
    uiSection: "Recuperar"
    next: act5/camp/frost_camp
    condition:
      all:
        - { hasItem: potion_mana }
        - { any: [{ class: mage }, { class: cleric }] }
    effects:
      - { op: useConsumable, itemId: potion_mana, targetIndex: 0 }
  - text: "Beber infusão serena (stress)"
    uiSection: "Recuperar"
    next: act5/camp/frost_camp
    condition: { hasItem: potion_stress }
    effects:
      - { op: useConsumable, itemId: potion_stress, targetIndex: 0 }
  - text: "Trocar duas palavras com o grupo"
    uiSection: "Conversa"
    next: act5/camp/frost_companion_chat
    condition: { companionCount: { gte: 1 } }
    showWhenLocked: true
    lockedHint: "Sem companheiro, não há grupo com quem trocar palavra."
  - text: "Manusear equipamento no acampamento"
    uiSection: "Acampamento"
    next: act5/camp/manage_equip
  - text: "Partilhar uma prece com devotos do Terceiro Sino"
    uiSection: "Acampamento"
    condition:
      all:
        - { rep: { faction: culto, gte: 2 } }
        - { noFlag: frost_camp_cult_prayer_done }
    next: act5/camp/frost_camp
    effects:
      - { op: setFlag, key: frost_camp_cult_prayer_done, value: true }
      - { op: addResource, resource: faith, delta: 1 }
      - { op: addResource, resource: corruption, delta: 1 }
      - { op: addDiary, text: "As brasas desenharam um sino invisível — ninguém tocou, mas todos ouviram." }
    preview: "+1 fé, +1 corrupção (uma vez)"
  - text: "Pedir escolta de pensamento à Vigília (contra o Culto)"
    uiSection: "Acampamento"
    condition:
      all:
        - { rep: { faction: vigilia, gte: 2 } }
        - { rep: { faction: culto, gte: 0 } }
        - { noFlag: frost_camp_vigilia_escort_done }
    next: act5/camp/frost_camp
    effects:
      - { op: setFlag, key: frost_camp_vigilia_escort_done, value: true }
      - { op: addRep, faction: culto, delta: -1, directGain: true }
      - { op: addRep, faction: vigilia, delta: 1 }
      - { op: addDiary, text: "Um capeador desenhou uma linha na neve entre mim e o rumor do sino." }
    preview: "Culto cai; Vigília sobe (lento) (uma vez)"
  - text: "Consagrar neve derretida como água benta (clérigo)"
    uiSection: "Acampamento"
    condition:
      all:
        - { class: cleric }
        - { resource: { supply: { gte: 1 } } }
        - { noFlag: frost_camp_cleric_rite_done }
    next: act5/camp/frost_camp
    effects:
      - { op: setFlag, key: frost_camp_cleric_rite_done, value: true }
      - { op: addResource, resource: supply, delta: -1 }
      - { op: addResource, resource: faith, delta: 2 }
      - { op: addDiary, text: "Derreti neve na lata do báculo até doer a mão — Deus ouve melhor quando a carne paga o calor." }
    preview: "−1 suprimento · +2 fé (uma vez)"
  - text: "Enterrar duas moedas no gelo para o Terceiro Sino"
    uiSection: "Acampamento"
    condition:
      all:
        - { rep: { faction: culto, gte: 1 } }
        - { resource: { gold: { gte: 2 } } }
        - { noFlag: frost_camp_cult_ice_gift_done }
    next: act5/camp/frost_camp
    effects:
      - { op: setFlag, key: frost_camp_cult_ice_gift_done, value: true }
      - { op: addResource, resource: gold, delta: -2 }
      - { op: addRep, faction: culto, delta: 1 }
      - { op: addResource, resource: corruption, delta: 1 }
      - { op: addDiary, text: "O gelo engoliu o ouro sem som — o rumor do sino ficou mais perto, ou foi o ouvido que cedeu." }
    preview: "−2 ouro · culto +1 · +1 corrupção (uma vez)"
  - text: "Continuar"
    uiSection: "Partir"
    next: act5/frost_hub
    effects:
      - { op: advanceDay }
onEnter:
  - { op: addRep, faction: culto, delta: 1 }
---
Peregrinos partilham calor em **pedaços**; o fogo **consome** — verdade única: **ninguém** sobe inteiro.

*Sem calendário na tempestade: **dia {{day}}**.* Se o vento calar, pode ser **emboscada** a afinar o arco.
