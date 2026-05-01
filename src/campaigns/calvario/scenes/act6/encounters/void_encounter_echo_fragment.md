---
id: act6/encounters/void_encounter_echo_fragment
title: Memória com dentes
chapter: 6
ambientTheme: void
choices:
  - text: "Cortar o hospedeiro e arrancar a lasca que o alimenta"
    effects:
      - op: startCombat
        encounterId: act6_wild_echo_fragment
        onVictory: shared/explore_nav_act6
        onDefeat: shared/game_over
        onFlee: shared/explore_nav_act6
onEnter: []
---
O **hospedeiro** repete o que não disseste; a **lasca** completa com o que **fugiste** de dizer. Entre os dois, nasce uma história **nova** — pior que a tua, porque é **coerente**.
