---
id: act3/cult_passage
title: Passagem do Culto
chapter: 3
ambientTheme: act3
choices:
  - text: "Deixar uma moeda no nicho — pedir passagem ao ouvido do Sino"
    preview: "Ouro e aprendizado · marca de confiança do culto (uma vez)."
    next: act3/hub_depths
    condition:
      all:
        - { rep: { faction: culto, gte: 5 } }
        - { noFlag: act3_cult_passage_culto_favor }
    effects:
      - { op: setFlag, key: act3_cult_passage_culto_favor, value: true }
      - { op: addResource, resource: gold, delta: 6 }
      - { op: addXp, amount: 18 }
      - { op: addDiary, text: "O cobre lambeu a moeda e o ar ficou mais denso — como se o túnel tivesse fechado contabilidade." }
  - text: "Seguir o atalho sem profanar o nicho"
    preview: "Deixar o ritual alheio no sítio — o mapa já mentiu por ti."
    next: act3/hub_depths
  - text: "Arrancar o caco e o fio — o culto nota, a Vigília também"
    preview: "Símbolo e prova no bolso; pressa e inimizade."
    next: act3/hub_depths
    condition: { noFlag: act3_cult_passage_desecrated }
    effects:
      - { op: setFlag, key: act3_cult_passage_desecrated, value: true }
      - { op: addResource, resource: supply, delta: -1 }
      - { op: addRep, faction: vigilia, delta: -1, directGain: true }
      - { op: addDiary, text: "Roubei o caco do Terceiro Sino ao nicho — o silêncio da ordem vai custar caro." }
onEnter:
  - { op: addRep, faction: culto, delta: 1 }
---
O mapa rasgado **sussurra** onde dobrar. Um símbolo do Terceiro Sino brilha.

Num nicho: **ossos** pequenos amarrados com fio de cobre, um **caco de sino** fincado como cravo, e um brasão da Vigília **raspado** até ficar ilegível — alguém quis apagar a ordem antes de apagar o nome **Morvayn** do rumor.

A passagem **estreita** cheira a sebo queimado; cada segundo parado é voto em quem vigia estes túneis.