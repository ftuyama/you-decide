---
id: act3/encounters/random_router
title: Escaramuças das profundezas
chapter: 3
ambientTheme: act3
randomBranch:
  id: act3_random_combat
  branches:
    - { weight: 1, next: act3/encounters/cult_ambush_scene }
    - { weight: 1, next: act3/encounters/stone_combat_intro }
    - { weight: 1, next: act3/encounters/cult_patrol_scene }
    - { weight: 0.35, next: act3/encounters/vigil_hunter_scene }
choices: []
onEnter: []
---
As profundezas não escolhem entre lâmina e pedra. Escolhem quem respira ao fim do eco.
