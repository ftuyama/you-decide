---
id: act5/encounters/frost_whelp_pack
title: Ninho das Crias Gélidas
chapter: 5
ambientTheme: act5
choices:
  - text: "Lutar contra as crias de geada"
    effects:
      - op: startCombat
        encounterId: frost_whelps
        onVictory: act5/frost_lair_approach
        onDefeat: act4/game_over
onEnter: []
---
Duas **crias** rodeiam-te com fome de calor vivo. Os olhos delas são **buracos** onde o luar foi congelado — e onde o teu reflexo **hesita** um segundo a mais do que devia.

Se passares, o covil deixa de ser rumor — torna-se **porta**. Depois disto, já não há **volta atrás** que não custe sangue ou orgulho.
