---
id: act5/frost_monk/triumph
title: Bênção da neve quieta
chapter: 5
ambientTheme: frost_mystery
artKey: frost_monk_blessing
highlight: true
choices:
  - text: "Regressar ao desfiladeiro — levar o silêncio no peito"
    next: act5/frost_hub
onEnter:
  - { op: adjustLeadStat, attr: luck, delta: 1 }
  - { op: grantLeadStoryPassive, id: monk_inner_peace }
  - { op: addMark, mark: monk_inner_peace }
  - { op: setFlag, key: frost_monk_blessing_done, value: true }
  - {
      op: addDiary,
      text: "Na gruta acima da tempestade, um monge sem rosto deu-me uma bênção estranha: não promessa, não milagre — só a certeza de que a sorte também pode ser disciplina. Ganhei a passiva Paz interior: +1 SOR, para sempre.",
    }
---
O monge **inclina** a cabeça — *não leves eu; leva isto: o mundo atira dados, e tu aprendeste a olhar sem pedir truque.*

Algo **assenta** no peito: **+1 SOR**, para sempre, como **passivo** silencioso. A gruta só **respira** quando sais.
