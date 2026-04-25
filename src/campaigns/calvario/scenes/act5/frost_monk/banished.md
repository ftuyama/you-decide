---
id: act5/frost_monk/banished
title: A gruta fecha
chapter: 5
ambientTheme: act5
artKey: frost_monk_sealed
choices:
  - text: "Descer sozinho — a montanha não discute"
    next: act5/frost_hub
onEnter:
  - { op: setFlag, key: monk_cave_banished, value: true }
  - {
      op: addDiary,
      text: "Falhei na gruta do monge. O vento empurrou-me para fora como quem tira um objeto errado de uma gaveta — e ouvi a pedra a fechar por dentro. Não há segunda entrada: aquele caminho acabou.",
    }
---
A gruta **recusa-te** — ar **estreito**, voz seca: *volta para onde ainda podes mentir com conforto.*

A montanha **empurra-te** para fora; **não há retorno** àquela boca — só **neve** que finge neutralidade.
