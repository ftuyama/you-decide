---
id: act4/fight_morvayn
chapter: 4
choices:
  - text: "Primeira fase — confronto!"
    effects:
      - op: startCombat
        encounterId: boss_morvayn_1
        onVictory: act4/fight_morvayn_2
        onDefeat: act4/game_over
onEnter: []
---
**Morvayn** levanta o cajado. Os dados decidem.