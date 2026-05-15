---
id: act2/faction/culto_envoy_blades
title: Carne de sino — ferro
chapter: 2
ambientTheme: act2
choices:
  - text: "Cortar a oração ao meio"
    effects:
      - op: startCombat
        encounterId: cultist_patrol
        onVictory: act2/hub_catacomb
        onFlee: act2/hub_catacomb
        onDefeat: shared/game_over
    preview: "Combate · cultista"
onEnter: []
---
[RASCUNHO] O **badalo** que **não** veio **chega** na **garganta**. O **Sino** **cobra** **à** **carne**.
