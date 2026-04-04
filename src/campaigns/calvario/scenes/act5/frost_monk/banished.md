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
A **pressão** muda — não violência, **recusa**. O ar torna-se **estreito**, como se a própria gruta decidisse que o teu sítio já não era ali.

Uma voz, quase **caridade** e quase **corte**:

— *Volta para onde ainda podes mentir com conforto.*

Passos **atrás** — não são teus. São da montanha a **empurrar**. Quando o branco te cospe de volta ao desfiladeiro, compreendes sem teatro: **não há retorno** àquela boca. O rumor morreu; ficou só **neve** a fingir neutralidade.
