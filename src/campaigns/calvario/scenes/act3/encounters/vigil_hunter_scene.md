---
id: act3/encounters/vigil_hunter_scene
title: Caçador da Vigília Perdida
chapter: 3
ambientTheme: act3
choices:
  - text: "Enfrentar o caçador no escuro"
    effects:
      - op: startCombat
        encounterId: vigil_hunter_fight
        onVictory: act3/hub_depths
        onDefeat: shared/game_over
        onFlee: act3/hub_depths
onEnter: []
---
Um **caçador** da Vigília, coberto de cal e fuligem, vigia a passagem como se ainda obedecesse ordens de um comandante morto.
