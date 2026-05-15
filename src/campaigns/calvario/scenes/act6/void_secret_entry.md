---
id: act6/void_secret_entry
title: Nervura do Abismo
chapter: 6
ambientTheme: void
artKey: act6_secret_maw
highlight: true
artHighlightSfx: mysterious
choices:
  - text: "Seguir o corredor que nao existe no mapa"
    next: act6/void_secret_pact
  - text: "Ouvir o metal na nervura — o rasto que não some"
    condition:
      all:
        - { noFlag: kaelsworn_recruited }
        - { noFlag: kr_won_act6 }
    preview: "Confronto verbal com Kael (rascunho); falha leva ao ferro."
    effects:
      - op: startCombat
        encounterId: kael_rival_act6_dialogue
        onVictory: shared/kaelsworn_post_act6
        onDefeat: shared/kael_act6_blades
        onFlee: act6/void_secret_entry
  - text: "Recuar antes que o vazio te reconheca"
    next: act6/hub_fractured_nave
onEnter:
  - { op: addDiary, text: "A corrupcao abriu uma porta que a lucidez nao via." }
---
As colunas afastam-se sem se mover. Entre elas surge um corredor de pedra molhada, feito de angulos que o olho recusa.

