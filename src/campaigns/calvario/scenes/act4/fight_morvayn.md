---
id: act4/fight_morvayn
title: Confronto com Morvayn
chapter: 4
choices:
  - text: "Primeira fase — confronto!"
    condition: { noMark: soul_scarred_by_seal }
    effects:
      - op: startCombat
        encounterId: boss_morvayn_1
        onVictory: act4/morvayn_interlude
        onDefeat: act4/game_over
  - text: "Primeira fase — confronto!"
    condition: { mark: soul_scarred_by_seal }
    effects:
      - op: startCombat
        encounterId: boss_morvayn_1_disadv
        onVictory: act4/morvayn_interlude
        onDefeat: act4/game_over
onEnter: []
---
**Morvayn** levanta o cajado. Os dados decidem.
