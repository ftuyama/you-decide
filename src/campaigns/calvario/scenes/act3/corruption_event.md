---
id: act3/corruption_event
title: Pulso de Corrupção
chapter: 3
ambientTheme: act3
choices:
  - text: "Tocar o cristal"
    next: act3/hub_depths
    effects:
      - { op: addResource, resource: corruption, delta: 1 }
  - text: "Ignorar"
    next: act3/hub_depths
onEnter: []
---
Um **cristal** verde pulsa. O eco da masmorra responde — um pulso que não pede permissão para falar baixo.