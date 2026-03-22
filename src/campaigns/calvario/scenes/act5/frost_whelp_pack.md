---
id: act5/frost_whelp_pack
chapter: 5
choices:
  - text: "Lutar contra as crias de geada"
    effects:
      - op: startCombat
        encounterId: frost_whelps
        onVictory: act5/frost_lair_approach
        onDefeat: act4/game_over
onEnter: []
---
Duas **crias** rodeiam-te com fome de calor vivo. Os olhos delas são **buracos** onde o luar foi congelado.

Se passares, o covil deixa de ser rumor — torna-se **porta**.
