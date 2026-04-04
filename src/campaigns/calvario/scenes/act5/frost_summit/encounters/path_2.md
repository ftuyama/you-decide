---
id: act5/frost_summit/encounters/path_2
title: Segundo bloqueio
chapter: 5
ambientTheme: act5
artKey: frost_summit_ascent
choices:
  - text: "Subir mais — o vento piora antes de calar"
    effects:
      - op: startCombat
        encounterId: summit_ascent_2
        onVictory: act5/frost_summit/encounters/path_3
        onDefeat: shared/game_over
        onFlee: act5/frost_summit/temple_gate
onEnter: []
---
O ar **afina** até ferir. Um **cultista** canta um compasso que não combina com a neve — como se o ritual já tivesse começado **antes** de tu chegares. Ao lado, o **saqueador** arrasta o metal: não é música; é **aviso**.

Cada passo pergunta se ainda queres **chegar** ao templo, ou se preferes **virar** lenda de quem fugiu.
