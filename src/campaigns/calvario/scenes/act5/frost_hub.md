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
        - { noFlag: tomas_rescued }
        - { level: { gte: 15 } }
  - text: "Rumor do escudeiro — corda e ritual no gelo"
    next: act5/frost_tomas_intro
    condition:
      all:
        - { noFlag: tomas_rescued }
        - { level: { gte: 20 } }
  - text: "Viver o acampamento no gelo"
    next: act5/frost_camp
  - text: "Mercador de tenda azul-trovão"
    next: act5/frost_merchant
  - text: "Patrulhar ao acaso — a cordilheira morde"
    next: act5/frost_random_router
  - text: "Montanhas de neve — rumor de um monge na gruta"
    next: act5/frost_snow_mountains_enter
    condition:
      all:
        - { noFlag: monk_cave_banished }
        - { noMark: monk_inner_peace }
        - { level: { gte: 25 } }
onEnter: []
---
Uma **lasca** de abrigo contra o vento: tendas que rangem como **dentes** velhos, fogareiro que mais **ameaça** do que aquece. Alguém deixou marcas na neve — **humanas**, **bestiais**, e uma terceira que não gosta de nome.

Aqui o mapa é **decisão** — não linha. Podes seguir o rumor, **negociar** o preço do calor, ou deixar a neve **escolher** por ti. O desfiladeiro não julga; só **cobre**.
