---
id: act4/sino_puzzle
chapter: 4
choices:
  - text: "◇ ◈ ◇ (sequência correta)"
    next: act4/throne_gate
    effects:
      - { op: setFlag, key: sino_solved, value: true }
  - text: "Tentativa errada"
    next: act4/throne_gate
    effects:
      - { op: addResource, resource: supply, delta: -1 }
onEnter: []
---
**Sino ao Luar**: alinhas runas. O eco agradece ou morde.