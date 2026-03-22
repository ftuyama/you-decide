---
id: act2/circle_ritual
chapter: 2
choices:
  - text: "Participar"
    next: act2/hub_catacomb
    effects:
      - { op: addResource, resource: corruption, delta: 1 }
      - { op: addRep, faction: circulo, delta: 1 }
  - text: "Recusar"
    next: act2/hub_catacomb
onEnter: []
---
Um mago do **Círculo** desenha cinza no chão. "Um preço leve", diz.