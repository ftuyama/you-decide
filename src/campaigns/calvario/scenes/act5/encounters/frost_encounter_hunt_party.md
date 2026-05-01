---
id: act5/encounters/frost_encounter_hunt_party
title: Matilha de caça
chapter: 5
ambientTheme: act5
choices:
  - text: "Enfrentar o bando de caça"
    effects:
      - op: startCombat
        encounterId: frost_hunt_party
        onVictory: shared/explore_nav_act5
        onDefeat: shared/game_over
        onFlee: shared/explore_nav_act5
onEnter: []
---
Três silhuetas fecham o cerco: duas crias de geada e um **fanático** de mantos rasgados, todos famintos de **calor** alheio. O cultista assobia um **compasso** que não combina com o vento — as crias só querem saber se o teu sangue ainda está **quente**.

Se hesitares, o gelo **fecha** o contrato por ti.
