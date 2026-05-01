---
id: act2/encounters/skeleton_combat_intro
title: Crânio e Ferrugem
chapter: 2
ambientTheme: act2
artKey: skeleton
choices:
  - text: "Lutar!"
    effects:
      - op: startCombat
        encounterId: skeleton_hall
        onVictory: act2/hub_catacomb
        onDefeat: shared/game_over
        onFlee: act2/flee_skeleton
onEnter: []
---
O esqueleto **crange** ao mover-se.