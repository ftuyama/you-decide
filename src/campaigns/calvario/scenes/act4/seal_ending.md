---
id: act4/seal_ending
chapter: 4
choices:
  - text: "Fim"
    next: act4/epilogue_modular
onEnter:
  - { op: addResource, resource: faith, delta: -2 }
  - { op: addMark, mark: calvario_sealed }
---
Selas o **Calvário** com preço. Cicatrizes na alma; paz frágil nas pedras.