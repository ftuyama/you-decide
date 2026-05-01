---
id: act6/encounters/void_encounter_fragment_solo
title: Decisão que ficou
chapter: 6
ambientTheme: void
choices:
  - text: "Enfrentar a lasca errante entre as colunas"
    effects:
      - op: startCombat
        encounterId: act6_wild_fragment_solo
        onVictory: shared/explore_nav_act6
        onDefeat: shared/game_over
        onFlee: shared/explore_nav_act6
onEnter: []
---
Do chão **levanta-se** uma silhueta sem rosto estável — não veio de fora; **escapou-te** há anos e aprendeu a **caminhar** sozinha.

Não pede perdão. Pede **continuidade**.
