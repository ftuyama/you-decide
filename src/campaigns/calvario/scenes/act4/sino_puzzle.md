---
id: act4/sino_puzzle
title: Enigma do Sino ao Luar
chapter: 4
ambientTheme: explore
choices:
  - text: "◇ ◈ ◇ (sequência do Terceiro Sino)"
    next: act4/throne_gate
    effects:
      - { op: setFlag, key: sino_solved, value: true }
      - { op: addDiary, text: "As runas do sino alinharam-se — o trono ouviu antes de eu chegar." }
  - text: "◈ ◇ ◈ (eco invertido — provar outro ritmo)"
    next: act4/throne_gate
    effects:
      - { op: addResource, resource: supply, delta: -1 }
      - { op: addResource, resource: corruption, delta: 1 }
      - { op: addDiary, text: "Inverti o compasso. O sino não tocou, mas algo mordeu-me por dentro." }
  - text: "◇ ◇ ◈ (pressa — apagar e avançar)"
    next: act4/throne_gate
    effects:
      - { op: addResource, resource: supply, delta: -2 }
      - { op: addResource, resource: faith, delta: -1 }
      - { op: addDiary, text: "Forcei a sequência. O metal lembrou-me que pressa também é erro." }
onEnter: []
---
**Sino ao Luar**: alinhas runas numa pedra que **respira**. O eco agradece, **morde**, ou finge obediência — conforme a ordem em que tocas o silêncio.

Cada padrão é uma **promessa** diferente ao trono.
