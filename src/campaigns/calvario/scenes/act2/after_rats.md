---
id: act2/after_rats
title: Após os Ratos
chapter: 2
choices:
  - text: "Continuar"
    next: act2/hub_catacomb
onEnter:
  - { op: addResource, resource: supply, delta: 1 }
  - { op: setFlag, key: rats_cleared, value: true }
---
Viscos escuros no calcanhar. Uma **vitória pequena** — mas suficiente para respirar.