---
id: act4/fight_morvayn_2
title: Despertar do Trono
chapter: 4
choices:
  - text: "Segunda fase — trono!"
    condition: { noMark: soul_scarred_by_seal }
    effects:
      - op: startCombat
        encounterId: boss_morvayn_2
        onVictory: act4/victory_peace
        onDefeat: act4/game_over
  - text: "Segunda fase — trono!"
    condition: { mark: soul_scarred_by_seal }
    effects:
      - op: startCombat
        encounterId: boss_morvayn_2_disadv
        onVictory: act4/victory_peace
        onDefeat: act4/game_over
onEnter: []
---
O trono **desperta**. Sua forma encorpa-se com ossos alheios.
