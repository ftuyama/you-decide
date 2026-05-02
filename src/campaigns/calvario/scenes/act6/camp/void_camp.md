---
id: act6/camp/void_camp
title: Fogueira de cinzas espelhadas
chapter: 6
ambientTheme: camp
artKey: act6_camp_ember
campCombatHint: true
choices:
  - text: "Alimentar a chama com memória (−1 suprimento)"
    uiSection: "Recuperar"
    next: act6/hub_fractured_nave
    condition: { resource: { supply: { gte: 1 } } }
    showWhenLocked: true
    lockedHint: "Precisas de pelo menos 1 suprimento para alimentar a chama."
    effects:
      - { op: campRest }
      - { op: advanceDay }
  - text: "Beber poção rubra (ti)"
    uiSection: "Recuperar"
    next: act6/camp/void_camp
    condition: { hasItem: potion_hp }
    effects:
      - { op: useConsumable, itemId: potion_hp, targetIndex: 0 }
  - text: "Dar poção rubra ao companheiro"
    uiSection: "Recuperar"
    next: act6/camp/void_camp
    condition: { all: [{ hasItem: potion_hp }, { companionCount: { gte: 1 } }] }
    effects:
      - { op: useConsumable, itemId: potion_hp, targetIndex: 1 }
  - text: "Beber tônico azul (mana)"
    uiSection: "Recuperar"
    next: act6/camp/void_camp
    condition:
      all:
        - { hasItem: potion_mana }
        - { any: [{ class: mage }, { class: cleric }] }
    effects:
      - { op: useConsumable, itemId: potion_mana, targetIndex: 0 }
  - text: "Beber infusão serena (stress)"
    uiSection: "Recuperar"
    next: act6/camp/void_camp
    condition: { hasItem: potion_stress }
    effects:
      - { op: useConsumable, itemId: potion_stress, targetIndex: 0 }
  - text: "Trocar duas palavras com o grupo"
    uiSection: "Conversa"
    next: act6/camp/void_companion_chat
    condition: { companionCount: { gte: 1 } }
    showWhenLocked: true
    lockedHint: "Sem companheiro, não há grupo com quem trocar palavra."
  - text: "Ver o cinzento engolir mais um dia"
    uiSection: "Acampamento"
    next: act6/camp/void_camp
    preview: "O dia narrativo avança; não recuperas força."
    effects:
      - { op: advanceDay }
  - text: "Manusear equipamento junto à luz instável"
    uiSection: "Acampamento"
    next: act6/camp/manage_equip
  - text: "Voltar à nave fraturada"
    uiSection: "Partir"
    next: act6/hub_fractured_nave
    effects:
      - { op: advanceDay }
onEnter: []
---
Não há **lenha** — só **restos** de quem já se queimou a si próprio. A fogueira **imita** calor; o teu corpo aceita a mentira porque **precisa** de um sítio onde fingir que ainda há **amanhã**.

*Mesmo aqui, o número segue: **dia {{day}}** — espelhado em cinza.*

O fumo sobe em **espirais** que lembram corredores — não perguntes para onde vão.
