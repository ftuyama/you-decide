---
id: shared/kael_act5_blades
title: Ferro no hálito branco
chapter: 5
ambientTheme: act5
choices:
  - text: "Medir ferro com Kael"
    effects:
      - op: startCombat
        encounterId: kael_rival_act5
        onVictory: shared/kaelsworn_post_act5
        onFlee: act5/frost_lair_approach
        onDefeat: shared/game_over
onEnter: []
---
[RASCUNHO] A **geada** **morde** a **frase**. Sobra **ferro** — e **rasto** que **não** **nega** **duelo**.
