---
id: act2/wild_encounter_bones_rare
chapter: 2
ambientTheme: explore
title: Ossos sem coro
choices:
  - text: "Enfrentar o sentinela de osso"
    effects:
      - op: startCombat
        encounterId: act2_rare_bone_sentinel
        onVictory: act2/hub_catacomb
        onDefeat: act4/game_over
        onFlee: act2/hub_catacomb
onEnter: []
---
Um único **esqueleto** ergue-se no cruzamento, sem cântico e sem pressa. Quando te vê, aponta a lâmina como quem cumpre um juramento antigo.
