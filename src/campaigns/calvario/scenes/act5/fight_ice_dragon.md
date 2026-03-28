---
id: act5/fight_ice_dragon
title: Vetrnax Desperta
chapter: 5
ambientTheme: act5
choices:
  - text: "Primeira fase — o hálito gela o ar"
    effects:
      - op: startCombat
        encounterId: boss_ice_dragon_1
        onVictory: act5/fight_ice_dragon_2
        onDefeat: act4/game_over
  - text: "Recuar — voltar ao desfiladeiro"
    next: act5/frost_hub
onEnter: []
---
**Vetrnax** desenrola o pescoço como uma **corda** de trovão. O primeiro assalto não é dente — é **frio** que rouba o som da língua. O ar **vibra** antes do golpe: o dragão não ataca só o corpo; ataca a **certeza** de que ainda estás vivo.

