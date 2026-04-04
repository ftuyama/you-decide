---
id: act3/encounters/stone_combat_intro
title: Pedra Contra Carne
chapter: 3
ambientTheme: act3
choices:
  - text: "Lutar!"
    effects:
      - op: startCombat
        encounterId: stone_guard_fight
        onVictory: act3/stone_guard_victory
        onDefeat: shared/game_over
onEnter: []
---
Pedra **contra** carne. Três camadas de armadura antes da ferida real.
