---
id: act2/encounters/wild_encounter_bones_rare
chapter: 2
ambientTheme: act2
title: Ossos sem coro
choices:
  - text: "Enfrentar o sentinela de osso"
    effects:
      - op: startCombat
        encounterId: act2_rare_bone_sentinel
        onVictory: shared/explore_nav_act2
        onDefeat: shared/game_over
        onFlee: shared/explore_nav_act2
onEnter: []
---
Um único **esqueleto** ergue-se no cruzamento, sem cântico e sem pressa. Quando te vê, aponta a lâmina como quem cumpre um juramento antigo.
