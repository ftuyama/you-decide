---
id: act5/frost_hub
chapter: 5
type: hub
ambientTheme: act5
artKey: frost_peaks
title: Desfiladeiro — acampamento improvisado
choices:
  - text: "Seguir o rasto de garras na neve (missão)"
    next: act5/frost_ridgeline
    condition:
      all:
        - { level: { gte: 18 } }
    preview: "Rasto, emboscada ou caça — a neve não julga."
  - text: "Rumor do escudeiro — corda e ritual no gelo"
    next: act5/frost_tomas/intro
    condition:
      all:
        - { noFlag: tomas_rescued }
        - { level: { gte: 20 } }
    preview: "História de Tomas; corda e gelo como teste."
  - text: "Viver o acampamento no gelo"
    next: act5/camp/frost_camp
    preview: "Descanso, suprimento e conversa ao fogo."
  - text: "Mercador de tenda azul-trovão"
    next: act5/frost_merchant
    preview: "Troca de ouro e itens; preço do frio."
  - text: "Patrulhar ao acaso — a cordilheira morde"
    next: act5/encounters/frost_random_router
    preview: "Sem escolher rota a tempo, recuas para o acampamento."
    timedMs: 14000
    fallbackNext: act5/camp/frost_camp
  - text: "Montanhas de neve — rumor de um monge na gruta"
    next: act5/frost_snow_mountains_enter
    condition:
      all:
        - { noFlag: monk_cave_banished }
        - { noMark: monk_inner_peace }
        - { level: { gte: 22 } }
    preview: "Gruta e provas do monge; paz ou banimento."
  - text: "Rumo ao cume — templo de pedra negra (caminho perigoso)"
    next: act5/frost_summit/ascend
    condition:
      level: { gte: 25 }
    preview: "Ascensão perigosa ao templo e ao que dorme no cume."
onEnter: []
---
Uma **lasca** de abrigo contra o vento: tendas que rangem como **dentes** velhos, fogareiro que mais **ameaça** do que aquece. Alguém deixou marcas na neve — **humanas**, **bestiais**, e uma terceira que não gosta de nome.

Aqui o mapa é **decisão** — não linha. Podes seguir o rumor, **negociar** o preço do calor, ou deixar a neve **escolher** por ti. O desfiladeiro não julga; só **cobre**.
