---
id: act5/frost_monk_triumph
title: Bênção da neve quieta
chapter: 5
ambientTheme: frost_mystery
artKey: frost_monk_blessing
choices:
  - text: "Regressar ao desfiladeiro — levar o silêncio no peito"
    next: act5/frost_hub
onEnter:
  - { op: adjustLeadStat, attr: luck, delta: 1 }
  - { op: addMark, mark: monk_inner_peace }
  - {
      op: addDiary,
      text: "Na gruta acima da tempestade, um monge sem rosto deu-me uma bênção estranha: não promessa, não milagre — só a certeza de que a sorte também pode ser disciplina. Sinto +1 em SOR (Paz interior).",
    }
---
O monge **inclina** a cabeça — não vitória, **encerramento**.

— *Não leves eu. Leva isto: o mundo vai continuar a atirar dados; tu, pelo menos, **aprendeste** a olhar para eles sem pedir truque.*

Algo **assenta** no peito — não calor, não brilho. Um **passivo** silencioso: uma linha fina de sorte que não pede nome, só **permanece**. O teu **SOR** aumenta em **1**, para sempre.

A gruta não agradece. Só **respira** quando sais.
