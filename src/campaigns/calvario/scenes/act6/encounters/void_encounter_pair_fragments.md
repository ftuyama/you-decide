---
id: act6/encounters/void_encounter_pair_fragments
title: Irmãos de renúncia
chapter: 6
ambientTheme: void
choices:
  - text: "Separar as duas lascas antes que se fundam"
    effects:
      - op: startCombat
        encounterId: act6_wild_fragments_pair
        onVictory: shared/explore_nav_act6
        onDefeat: shared/game_over
        onFlee: shared/explore_nav_act6
onEnter: []
---
Duas sombras **discutem** em sussurro — não contigo, **entre si** — sobre qual mentira te serve melhor. Quando te veem, o debate **acaba**: primeiro comes tu, depois o resto.
