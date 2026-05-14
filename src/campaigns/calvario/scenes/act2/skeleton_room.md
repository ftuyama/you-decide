---
id: act2/skeleton_room
title: Sala dos Ossos Armados
chapter: 2
ambientTheme: act2
artKey: skeleton
highlight: true
artHighlightSfx: mysterious
choices:
  - text: "Rasto de ferro na penumbra — um silhueta observa, imóvel"
    condition:
      all:
        - { noFlag: kaelsworn_recruited }
        - { noFlag: kr_won_act2 }
    preview: "Encontro especial: Kael, o Rastreador Cinzento."
    effects:
      - op: startCombat
        encounterId: kael_rival_act2
        onVictory: shared/kaelsworn_post_act2
        onFlee: act2/skeleton_room
        onDefeat: shared/game_over
  - text: "Forçar a porta"
    next: act2/encounters/skeleton_combat_intro
onEnter: []
---
Restos armados erguem-se por **hábito**, não por vontade.