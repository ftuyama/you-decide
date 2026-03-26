---
id: act5/frost_encounter_solo_whelp
title: Cria perdida
chapter: 5
choices:
  - text: "Enfrentar a cria isolada"
    effects:
      - op: startCombat
        encounterId: frost_whelp_solo
        onVictory: act5/frost_hub
        onDefeat: act4/game_over
        onFlee: act5/frost_hub
onEnter: []
---
Uma só **cria** te seguiu pelo eco dos teus passos — curiosidade ou **fome**, o resultado é o mesmo.
