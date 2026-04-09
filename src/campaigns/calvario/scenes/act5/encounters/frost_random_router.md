---
id: act5/encounters/frost_random_router
title: Neve que escolhe por ti
chapter: 5
ambientTheme: act5
randomBranch:
  id: frost_rb
  branches:
    - { weight: 1, next: act5/encounters/frost_encounter_whelps }
    - { weight: 1, next: act5/encounters/frost_encounter_solo_whelp }
    - { weight: 1, next: act5/encounters/frost_encounter_cultist }
    - { weight: 0.25, next: act5/encounters/frost_encounter_hunt_party }
    - { weight: 0.1, next: act5/encounters/frost_encounter_howl_horde }
    - weight: 0.35
      next: act5/encounters/frost_stranded_traveler
      condition: { noFlag: frost_stranded_traveler_done }
    - { weight: 1, next: act5/frost_hub }
choices: []
onEnter: []
---
Fechas os olhos um segundo — a **tempestade** decide o próximo passo. Às vezes é só **neve** a fingir calma; outras, é **presa** a fingir acaso.

Lança os dados no **branco**: o resultado não pergunta se estás pronto.
