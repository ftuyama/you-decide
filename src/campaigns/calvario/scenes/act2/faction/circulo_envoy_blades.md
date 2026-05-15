---
id: act2/faction/circulo_envoy_blades
title: Cinza viva — ferro
chapter: 2
ambientTheme: act2
choices:
  - text: "Rasgar o desenho antes que feche"
    effects:
      - op: startCombat
        encounterId: faction_circle_initiate
        onVictory: act2/hub_catacomb
        onFlee: act2/hub_catacomb
        onDefeat: shared/game_over
    preview: "Combate · adepto osso"
onEnter: []
---
[RASCUNHO] O **cinza** **morde**. O **Círculo** cobra **à mão** o que **não** conseguiu **cobrar** à **voz**.
