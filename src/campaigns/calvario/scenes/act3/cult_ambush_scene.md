---
id: act3/cult_ambush_scene
title: Emboscada dos Cultistas
chapter: 3
choices:
  - text: "Lutar na emboscada!"
    effects:
      - op: startCombat
        encounterId: cult_ambush
        onVictory: act3/hub_depths
        onDefeat: act4/game_over
        onFlee: act3/flee_cult
onEnter: []
---
**Cultistas** já te esperavam. Vantagem deles — dados mostrarão.