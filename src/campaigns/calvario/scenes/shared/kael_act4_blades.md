---
id: shared/kael_act4_blades
title: Ferro na passagem
chapter: 4
ambientTheme: explore
choices:
  - text: "Medir ferro com Kael"
    effects:
      - op: startCombat
        encounterId: kael_rival_act4
        onVictory: shared/kaelsworn_post_act4
        onFlee: act4/passage_graywind_heights
        onDefeat: shared/game_over
onEnter: []
---
[RASCUNHO] O **vento** **espera**. Kael **não** — o **metal** **já** **decidiu** o **tom**.
