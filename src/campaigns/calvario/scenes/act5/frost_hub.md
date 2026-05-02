---
id: act5/frost_hub
chapter: 5
type: hub
ambientTheme: act5
artKey: frost_peaks
highlight: true
title: Desfiladeiro — acampamento improvisado
choices:
  - text: "Patrulhar o desfiladeiro (explorar mapa)"
    uiSection: "Explorar"
    next: shared/explore_nav_act5
    preview: "Caminhar pelo gelo com risco de encontro e aumento de stress."
    effects:
      - { op: setExploration, graphId: act5_frost, nodeId: frost_broken_watch }
      - { op: setAsciiMap, mapId: act5_frost }
  - text: "Seguir o rasto de garras na neve (missão)"
    uiSection: "Missões"
    next: act5/frost_ridgeline
    condition:
      all:
        - { level: { gte: 18 } }
        - { day: { lte: 10 } }
        - { flag: act5_explore_goal_reached }
    showWhenLocked: true
    lockedHint: "Precisas de nível 18, janela até ao dia 10 e de alcançar primeiro a trilha do templo no mapa do desfiladeiro (patrulha a partir do acampamento)."
    preview: "Rasto, emboscada ou caça — a neve não julga."
  - text: "Rumor do escudeiro — corda e ritual no gelo"
    uiSection: "Missões"
    next: act5/frost_tomas/intro
    condition:
      all:
        - { noFlag: tomas_rescued }
        - { noFlag: tomas_rescue_missed }
        - { level: { gte: 15 } }
        - { day: { lte: 15 } }
    preview: "História de Tomás; corda e gelo — mas o rumor esfria depois do dia 15."
  - text: "Rumor do escudeiro — só eco e corda vazia no gelo"
    uiSection: "Missões"
    next: act5/frost_tomas/missed
    condition:
      all:
        - { noFlag: tomas_rescued }
        - { noFlag: tomas_rescue_missed }
        - { level: { gte: 15 } }
        - { day: { gte: 16 } }
    preview: "Demasiado tarde; o desfiladeiro já aprendeu outro nome para justiça."
  - text: "Viver o acampamento no gelo"
    uiSection: "Fogo e troca"
    next: act5/camp/frost_camp
    preview: "Descanso, suprimento e conversa ao fogo."
  - text: "Mercador de tenda azul-trovão"
    uiSection: "Fogo e troca"
    next: act5/frost_merchant
    preview: "Troca de ouro e itens; preço do frio."
  - text: "Montanhas de neve — rumor de um monge na gruta"
    uiSection: "Cume e gruta"
    next: act5/frost_snow_mountains_enter
    condition:
      all:
        - { noFlag: monk_cave_banished }
        - { noFlag: frost_monk_blessing_done }
        - { level: { gte: 22 } }
        - { day: { lte: 10 } }
    preview: "Gruta e provas do monge; paz ou banimento."
  - text: "Rumo ao cume — templo de pedra negra (caminho perigoso)"
    uiSection: "Cume e gruta"
    next: act5/frost_summit/ascend
    condition:
      all:
        - { level: { gte: 25 } }
        - { day: { lte: 10 } }
        - { flag: act5_explore_goal_reached }
    showWhenLocked: true
    lockedHint: "O cume exige nível 25, janela até ao dia 10 e encontrar primeiro a trilha do templo no mapa."
    preview: "Ascensão perigosa ao templo e ao que dorme no cume."
onEnter:
  - { op: addXp, amount: 14 }
---
**Tendas** rangem como dentes velhos; o fogo mais **ameaça** do que aquece. **Mesmo** silêncio de peso, **palco** maior: neve, marcas **humanas**, **bestiais** e uma terceira sem nome.

O mapa aqui é **decisão** — rumor, **troca** de calor, ou deixar a neve **escolher**. O desfiladeiro só **cobre**.
