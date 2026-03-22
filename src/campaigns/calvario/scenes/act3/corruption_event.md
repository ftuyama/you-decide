---
id: act3/corruption_event
chapter: 3
choices:
  - text: "Tocar o cristal"
    next: act3/hub_depths
    effects:
      - { op: addResource, resource: corruption, delta: 1 }
  - text: "Ignorar"
    next: act3/hub_depths
onEnter: []
---
Um **cristal** verde pulsa. O Eco do Calvário responde.