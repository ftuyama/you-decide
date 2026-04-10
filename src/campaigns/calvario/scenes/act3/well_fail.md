---
id: act3/well_fail
title: Engano do Poço
chapter: 3
ambientTheme: act3
choices:
  - text: "Avançar mesmo assim"
    next: act3/encounters/cult_ambush_scene
onEnter:
  - { op: setFlag, key: false_map, value: true }
  - { op: addMark, mark: act3_well_snare }
---
Acreditas no reflexo. Algo na próxima sala **prepara-te** uma surpresa.