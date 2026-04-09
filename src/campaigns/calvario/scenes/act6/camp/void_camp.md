---
id: act6/camp/void_camp
title: Fogueira de cinzas espelhadas
chapter: 6
ambientTheme: camp
artKey: act6_camp_ember
campCombatHint: true
choices:
  - text: "Alimentar a chama com memória (−1 suprimento)"
    next: act6/hub_fractured_nave
    condition: { resource: { supply: { gte: 1 } } }
    effects:
      - { op: campRest }
      - { op: advanceDay }
  - text: "Beber poção rubra (ti)"
    next: act6/camp/void_camp
    condition: { hasItem: potion_hp }
    effects:
      - { op: useConsumable, itemId: potion_hp, targetIndex: 0 }
  - text: "Dar poção rubra ao companheiro"
    next: act6/camp/void_camp
    condition: { all: [{ hasItem: potion_hp }, { companionCount: { gte: 1 } }] }
    effects:
      - { op: useConsumable, itemId: potion_hp, targetIndex: 1 }
  - text: "Beber tônico azul (mana)"
    next: act6/camp/void_camp
    condition:
      all:
        - { hasItem: potion_mana }
        - { any: [{ class: mage }, { class: cleric }] }
    effects:
      - { op: useConsumable, itemId: potion_mana, targetIndex: 0 }
  - text: "Beber infusão serena (stress)"
    next: act6/camp/void_camp
    condition: { hasItem: potion_stress }
    effects:
      - { op: useConsumable, itemId: potion_stress, targetIndex: 0 }
  - text: "Trocar duas palavras com o grupo"
    next: act6/camp/void_companion_chat
    condition: { companionCount: { gte: 1 } }
  - text: "Ver o cinzento engolir mais um dia"
    next: act6/camp/void_camp
    preview: "O dia narrativo avança; não recuperas força."
    effects:
      - { op: advanceDay }
  - text: "Manusear equipamento junto à luz instável"
    next: act6/camp/manage_equip
  - text: "Voltar à nave fraturada"
    next: act6/hub_fractured_nave
    effects:
      - { op: advanceDay }
onEnter: []
---
Não há **lenha** — só **restos** de quem já se queimou a si próprio. A fogueira **imita** calor; o teu corpo aceita a mentira porque **precisa** de um sítio onde fingir que ainda há **amanhã**.

*Mesmo aqui, o número segue: **dia {{day}}** — espelhado em cinza.*

O fumo sobe em **espirais** que lembram corredores — não perguntes para onde vão.
