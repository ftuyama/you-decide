---
id: act5/frost_hub
chapter: 5
type: hub
ambientTheme: act5
artKey: frost_peaks
highlight: true
title: Desfiladeiro — acampamento improvisado
choices:
  - text: "Seguir o rasto de garras na neve (missão)"
    next: act5/frost_ridgeline
    condition:
      all:
        - { level: { gte: 18 } }
        - { day: { lte: 10 } }
    showWhenLocked: true
    lockedHint: "A neve só mantém o rasto legível com força (nível 18) e cedo no ciclo (até ao dia 10)."
    preview: "Rasto, emboscada ou caça — a neve não julga."
  - text: "Rumor do escudeiro — corda e ritual no gelo"
    next: act5/frost_tomas/intro
    condition:
      all:
        - { noFlag: tomas_rescued }
        - { noFlag: tomas_rescue_missed }
        - { level: { gte: 20 } }
        - { day: { lte: 15 } }
    preview: "História de Tomás; corda e gelo — mas o rumor esfria depois do dia 15."
  - text: "Rumor do escudeiro — só eco e corda vazia no gelo"
    next: act5/frost_tomas/missed
    condition:
      all:
        - { noFlag: tomas_rescued }
        - { noFlag: tomas_rescue_missed }
        - { level: { gte: 20 } }
        - { day: { gte: 16 } }
    preview: "Demasiado tarde; o desfiladeiro já aprendeu outro nome para justiça."
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
        - { noFlag: frost_monk_blessing_done }
        - { level: { gte: 22 } }
        - { day: { lte: 10 } }
    preview: "Gruta e provas do monge; paz ou banimento."
  - text: "Rumo ao cume — templo de pedra negra (caminho perigoso)"
    next: act5/frost_summit/ascend
    condition:
      all:
        - { level: { gte: 25 } }
        - { day: { lte: 10 } }
    showWhenLocked: true
    lockedHint: "O cume exige corpo de veterano (nível 25) e janela curta no calendário da tempestade (até ao dia 10)."
    preview: "Ascensão perigosa ao templo e ao que dorme no cume."
onEnter: []
---
**Tendas** rangem como dentes velhos; o fogo mais **ameaça** do que aquece. Na neve: marcas **humanas**, **bestiais** e uma terceira sem nome.

O mapa aqui é **decisão** — rumor, **troca** de calor, ou deixar a neve **escolher**. O desfiladeiro só **cobre**.
