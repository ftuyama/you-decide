---
id: act2/encounters/wild_encounter_mixed
chapter: 2
ambientTheme: act2
title: Cella mista
choices:
  - text: "Lutar contra ratos e osso"
    effects:
      - op: startCombat
        encounterId: cellar_mixed
        onVictory: shared/explore_nav_act2
        onDefeat: shared/game_over
        onFlee: shared/explore_nav_act2
onEnter: []
---
**Rato** e **esqueleto** dividem o mesmo chão — como se a morte e a vida tivessem combinado **preço**.
