---
id: act2/random_router
title: Escaramuças da Catacumba
chapter: 2
ambientTheme: explore
randomBranch:
  id: act2_random_combat
  branches:
    - { weight: 1, next: act2/wild_encounter_rats }
    - { weight: 1, next: act2/wild_encounter_mixed }
    - { weight: 1, next: act2/wild_encounter_cultist }
    - { weight: 0.2, next: act2/wild_encounter_bones_rare }
    - { weight: 0.2, next: act2/wild_encounter_lone_swarm_rare }
choices: []
onEnter: []
---
Cada passo ecoa como um dado lançado na pedra. A catacumba responde com lâmina, osso e fome.
