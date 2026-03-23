---
id: act5/fight_ice_dragon
title: Vetrnax Desperta
chapter: 5
choices:
  - text: "Primeira fase — o hálito gela o ar"
    effects:
      - op: startCombat
        encounterId: boss_ice_dragon_1
        onVictory: act5/fight_ice_dragon_2
        onDefeat: act4/game_over
onEnter: []
---
**Vetrnax** desenrola o pescoço como uma **corda** de trovão. O primeiro assalto não é dente — é **frio** que rouba o som da língua.
