---
id: shared/kael_act2_blades
title: Ferro na sala dos ossos
chapter: 2
ambientTheme: act2
choices:
  - text: "Medir ferro com Kael"
    effects:
      - op: startCombat
        encounterId: kael_rival_act2
        onVictory: shared/kaelsworn_post_act2
        onFlee: act2/skeleton_room
        onDefeat: shared/game_over
onEnter: []
---
[RASCUNHO] A **palavra** **partiu**. Resta **contagem** — e o **cinzento** **já** **avançou**.
