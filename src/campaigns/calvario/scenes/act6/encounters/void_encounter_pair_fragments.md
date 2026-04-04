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
        onVictory: act6/hub_fractured_nave
        onDefeat: shared/game_over
        onFlee: act6/hub_fractured_nave
onEnter: []
---
Duas sombras **discutem** em sussurro — não contigo, **entre si** — sobre qual mentira te serve melhor. Quando te veem, o debate **acaba**: primeiro comes tu, depois o resto.
