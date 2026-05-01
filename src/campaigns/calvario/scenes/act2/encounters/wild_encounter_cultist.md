---
id: act2/encounters/wild_encounter_cultist
chapter: 2
ambientTheme: act2
title: Patrulha solitária
choices:
  - text: "Bater no cultista isolado"
    effects:
      - op: startCombat
        encounterId: cultist_patrol
        onVictory: shared/explore_nav_act2
        onDefeat: shared/game_over
        onFlee: shared/explore_nav_act2
onEnter: []
---
Um **cultista** demasiado confiante separa-se do coro. A voz dele **treme** — não de medo, de **êxtase** barato.
