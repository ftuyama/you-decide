---
id: act4/throne_nerves_fail
title: Tropeção
chapter: 4
ambientTheme: explore
choices:
  - text: "Aceitar o susto e voltar à ante-sala"
    next: act4/throne_gate
    effects:
      - { op: addResource, resource: supply, delta: -1 }
      - { op: addDiary, text: "Tropecei onde não havia nada — o trono gosta de fingir buracos." }
onEnter: []
---
A sola **escorrega** em memória espessa. Não caís — mas **pagar** o susto com fôlego e suor.
