---
id: act7/event_silent_bell
title: Sino sem língua
chapter: 7
ambientTheme: ash_sky
artKey: rust_bell
choices:
  - text: "Segurar o badalo com luva — pagar em fé o que não tem preço em ouro"
    next: act7/before_final_horizon
    effects:
      - { op: addResource, resource: faith, delta: -1 }
      - { op: addMark, mark: act7_bell_paid_faith }
      - { op: addDiary, text: "Toquei um sino que não tinha som — só peso. A fé saiu-me do peito como moeda." }
    preview: "−1 fé · marca"
  - text: "Deixar o metal roer a promessa que ainda te mente"
    next: act7/before_final_horizon
    effects:
      - { op: addResource, resource: corruption, delta: 1 }
      - { op: addMark, mark: act7_bell_ate_promise }
      - { op: addDiary, text: "O sino não badalou — mastigou. Fiquei com o gosto de segredo velho na língua." }
    preview: "+1 corrupção · marca"
onEnter: []
---
No meio do descampo, um **sino** pendurado em nada — **língua** arrancada, badalo **mudo**. Ainda assim, o ar **vibra** como se alguém tivesse acabado de **mentir** em voz alta.

Tocar ou não tocar: o preço não está escrito — está **na mão**.
