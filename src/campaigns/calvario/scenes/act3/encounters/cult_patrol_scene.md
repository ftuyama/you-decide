---
id: act3/encounters/cult_patrol_scene
title: Patrulha do Mensageiro Cego
chapter: 3
ambientTheme: act3
choices:
  - text: "Atacar antes que toquem o sino"
    effects:
      - op: startCombat
        encounterId: cultist_patrol
        onVictory: act3/hub_depths
        onDefeat: shared/game_over
        onFlee: act3/hub_depths
onEnter: []
---
Um **mensageiro** sem olhos guia dois acólitos pelo corredor. O sino preso ao pulso dele marca teu tempo em batidas de condenação.
