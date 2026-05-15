---
id: shared/kael_act6_blades
title: Ferro na nervura
chapter: 6
ambientTheme: void
choices:
  - text: "Medir ferro com Kael"
    effects:
      - op: startCombat
        encounterId: kael_rival_act6
        onVictory: shared/kaelsworn_post_act6
        onFlee: act6/void_secret_entry
        onDefeat: shared/game_over
onEnter: []
---
[RASCUNHO] O **vazio** **engole** a **última** **sílaba**. O **eco** **cala** — o **cinzento** **não**.
