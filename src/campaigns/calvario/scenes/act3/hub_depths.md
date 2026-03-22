---
id: act3/hub_depths
chapter: 3
artKey: depths
choices:
  - text: "Voltar ao Cruzeiro — hub"
    next: act2/hub_catacomb
    effects:
      - { op: setChapter, chapter: 2 }
  - text: "Rumo ao trono de ossos"
    next: act4/throne_gate
    effects:
      - { op: setChapter, chapter: 4 }
      - { op: addDiary, text: "O trono chama." }
  - text: "Lado do guardião (opcional)"
    next: act3/stone_corridor
onEnter:
  - { op: clearAsciiMap }
---
Profundezas **silenciosas**. Morvayn não está longe.