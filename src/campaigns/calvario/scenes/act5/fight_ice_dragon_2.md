---
id: act5/fight_ice_dragon_2
title: Silêncio de Gelo
chapter: 5
ambientTheme: act5
choices:
  - text: "Segunda fase — partir o coração da geada"
    effects:
      - op: startCombat
        encounterId: boss_ice_dragon_2
        onVictory: act5/frost_epilogue
        onDefeat: act4/game_over
onEnter: []
---
O dragão **rasga** o próprio rugido e deixa entrar um **silêncio** pior que o barulho.

No peito dele, algo **pulsa** — não sangue, mas uma **nota** presa, como um sino fundido ao osso.

Se o partires, o Terceiro Sino ouve — ou **cala** para sempre.
