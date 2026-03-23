---
id: act2/random_router
title: Ramo Aleatório da Catacumba
chapter: 2
randomBranch:
  id: rb1
  branches:
    - { weight: 1, next: act2/recruit_offer, condition: { noFlag: mira_recruited } }
    - { weight: 1, next: act2/merchant_moon, condition: { noItem: rumor_map } }
    - { weight: 1, next: act2/wild_encounter_rats }
    - { weight: 1, next: act2/wild_encounter_mixed }
    - { weight: 1, next: act2/wild_encounter_cultist }
    - { weight: 1, next: act2/hub_catacomb }
choices: []
onEnter: []
---
