---
id: shared/explore_nav_act3
title: Perímetro das profundezas
chapter: 3
type: exploration
ambientTheme: act3
choices:
  - id: explore_patrol_random
    text: "Patrulhar ao acaso (encontro aleatório)"
    uiSection: "No perímetro"
    preview: "Sem mover no mapa — as profundezas decidem na violência."
    effects:
      - op: startWildEncounterFromGraph
        graphId: act3_depths
  - id: explore_leave
    text: "Recuar para o núcleo das profundezas"
    next: act3/hub_depths
    uiSection: "No perímetro"
    effects:
      - { op: clearAsciiMap }
    preview: "Voltar ao hub e manter o stress atual."
onEnter: []
---
Nas **profundezas**, o eco mastiga nomes antes de os devolver. O mapa não promete saída — só direção.

**Morvayn** não precisa de testemunhas para governar o medo: basta **Vigília** a apertar o juramento, **Círculo** a negociar o cinza, e **Terceiro Sino** a cobrar o que sobrou. Com o **mapa rasgado** na cabeça, vês onde a pedra **mente** menos — sem ele, só restam **ouvido** e **pressa**, e ambos falham ao mesmo tempo.
