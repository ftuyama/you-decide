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
        onVictory: act2/hub_catacomb
        onDefeat: act4/game_over
        onFlee: act2/flee_rats
onEnter: []
---
Dois **vórtices** de dentes fecham-te o corredor. Não é emboscada de gente — é **fome** organizada.
