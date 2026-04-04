---
id: act2/circle_ritual
title: Ritual do Círculo
chapter: 2
ambientTheme: explore
choices:
  - text: "Participar"
    next: act2/hub_catacomb
    preview: "Aceitar o cinza — ou hesitar e recuar."
    timedMs: 12000
    fallbackNext: act2/circle_ritual_refuse_mind
    effects:
      - { op: addResource, resource: corruption, delta: 1 }
      - { op: addRep, faction: circulo, delta: 1 }
  - text: "Recusar"
    next: act2/circle_ritual_refuse_mind
    preview: "Mente — manter a clareza ao recusar (TN 8)"
onEnter: []
repeatOnLeave:
  - { op: advanceDay }
---
Um mago do **Círculo** desenha cinza no chão. "Um preço leve", diz.
