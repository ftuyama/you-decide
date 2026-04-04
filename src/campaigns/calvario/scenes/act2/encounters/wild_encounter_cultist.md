---
id: act2/encounters/wild_encounter_cultist
chapter: 2
ambientTheme: explore
title: Patrulha solitária
choices:
  - text: "Bater no cultista isolado"
    effects:
      - op: startCombat
        encounterId: cultist_patrol
        onVictory: act2/hub_catacomb
        onDefeat: shared/game_over
        onFlee: act2/hub_catacomb
onEnter: []
---
Um **cultista** demasiado confiante separa-se do coro. A voz dele **treme** — não de medo, de **êxtase** barato.
