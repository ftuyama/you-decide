---
id: act4/pact_ending
chapter: 4
choices:
  - text: "Fim"
    next: act4/epilogue_modular
onEnter:
  - { op: addResource, resource: corruption, delta: 3 }
  - { op: addMark, mark: pact_bound }
---
Serves ao **Terceiro Sino**. A cidade dorme sob um silêncio novo — húmido e obediente.