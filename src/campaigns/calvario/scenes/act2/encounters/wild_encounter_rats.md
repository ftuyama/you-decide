---
id: act2/encounters/wild_encounter_rats
chapter: 2
ambientTheme: explore
title: Enxame duplo
choices:
  - text: "Encarar dois enxames"
    effects:
      - op: startCombat
        encounterId: rats_cellar_pair
        onVictory: shared/explore_nav_act2
        onDefeat: shared/game_over
        onFlee: shared/explore_nav_act2
onEnter: []
---
Dois **vórtices** de dentes fecham-te o corredor. Não é emboscada de gente — é **fome** organizada.
