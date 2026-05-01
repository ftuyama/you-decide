---
id: shared/explore_nav_act3
title: Perímetro das profundezas
chapter: 3
type: exploration
ambientTheme: act3
choices:
  - id: explore_force
    text: "Forçar encontro (combate aleatório)"
    preview: "Sem mover no mapa — só violência."
  - id: explore_leave
    text: "Recuar para o núcleo das profundezas"
    next: act3/hub_depths
    effects:
      - { op: clearAsciiMap }
    preview: "Voltar ao hub e manter o stress atual."
onEnter: []
---
Nas **profundezas**, o eco mastiga nomes antes de os devolver. O mapa não promete saída — só direção.
