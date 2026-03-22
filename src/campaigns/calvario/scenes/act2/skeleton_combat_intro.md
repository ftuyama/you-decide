---
id: act2/skeleton_combat_intro
chapter: 2
artKey: skeleton
choices:
  - text: "Lutar!"
    effects:
      - op: startCombat
        encounterId: skeleton_hall
        onVictory: act2/hub_catacomb
        onDefeat: act4/game_over
        onFlee: act2/flee_skeleton
onEnter: []
---
O esqueleto **crange** ao mover-se.