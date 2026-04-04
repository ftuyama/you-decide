---
id: act3/hub_depths
title: Núcleo das Profundezas
chapter: 3
type: hub
ambientTheme: act3
artKey: depths
choices:
  - text: "Rumo ao trono de ossos"
    next: act4/throne/throne_gate
    condition: { level: { gte: 7 } }
    preview: "Capítulo 4 — confronto com Morvayn; o trono espera."
    timedMs: 15000
    fallbackNext: act3/stone_corridor
    effects:
      - { op: setChapter, chapter: 4 }
      - { op: addDiary, text: "O trono chama." }
  - text: "Lado do guardião (opcional)"
    next: act3/stone_corridor
    condition: { noFlag: stone_guard_defeated }
    preview: "Runas, golem e provas antes do trono."
  - text: "Rever o corredor de pedra (eco do guardião)"
    next: act3/stone_corridor
    condition: { flag: stone_guard_defeated }
    preview: "O silêncio agora é teu — runas e nicho, sem o golem."
  - text: "Voltar ao Cruzeiro — hub"
    next: act2/hub_catacomb
    preview: "Sobe ao cruzeiro; capítulo 2 no mapa da história."
    effects:
      - { op: setChapter, chapter: 2 }
onEnter:
  - { op: clearAsciiMap }
---
Profundezas **silenciosas**. Morvayn não está longe.
