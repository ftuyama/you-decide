---
id: shared/explore_nav_act3
title: Perímetro das profundezas
chapter: 3
type: exploration
ambientTheme: act3
choices:
  - id: explore_leave
    text: "Recuar para o núcleo das profundezas"
    next: act3/hub_depths
    uiSection: "No perímetro"
    effects:
      - { op: clearAsciiMap }
    preview: "Voltar ao hub e manter o stress atual."
  - id: explore_patrol_random
    text: "Patrulhar ao acaso (encontro aleatório)"
    next: act3/encounters/random_router
    uiSection: "No perímetro"
    preview: "Sem mover no mapa — as profundezas decidem na violência."
onEnter: []
---
Nas **profundezas**, o eco mastiga nomes antes de os devolver. O mapa não promete saída — só direção.
