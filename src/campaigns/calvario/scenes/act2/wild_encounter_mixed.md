---
id: act2/wild_encounter_mixed
chapter: 2
ambientTheme: explore
title: Cella mista
choices:
  - text: "Lutar contra ratos e osso"
    effects:
      - op: startCombat
        encounterId: cellar_mixed
        onVictory: act2/hub_catacomb
        onDefeat: act4/game_over
        onFlee: act2/flee_rats
onEnter: []
---
**Rato** e **esqueleto** dividem o mesmo chão — como se a morte e a vida tivessem combinado **preço**.
