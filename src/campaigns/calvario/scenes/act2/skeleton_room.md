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
    preview: "Confronto verbal com Kael (rascunho); falha leva ao ferro."
    effects:
      - op: startCombat
        encounterId: kael_rival_act2_dialogue
        onVictory: shared/kaelsworn_post_act2
        onDefeat: shared/kael_act2_blades
        onFlee: act2/skeleton_room
  - text: "Forçar a porta"
    next: act2/encounters/skeleton_combat_intro
onEnter: []
---
Restos armados erguem-se por **hábito**, não por vontade.