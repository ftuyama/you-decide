---
id: shared/explore_nav_act5
title: Trilhas do desfiladeiro
chapter: 5
type: exploration
ambientTheme: act5
choices:
  - id: explore_leave
    text: "Voltar ao acampamento no gelo"
    next: act5/camp/frost_camp
    uiSection: "No perímetro"
    effects:
      - { op: clearAsciiMap }
    preview: "Recuar para o fogo e manter o stress atual."
  - id: explore_patrol_random
    text: "Patrulhar ao acaso (encontro aleatório)"
    next: act5/encounters/frost_random_router
    uiSection: "No perímetro"
    preview: "Sem mover no mapa — a cordilheira decide na violência."
onEnter: []
---
A neve apaga pegadas novas e antigas com a mesma indiferença. O que muda é quem ainda consegue ler o traço.
