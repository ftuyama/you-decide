---
id: act2/circle_ritual/circle_ritual
title: Ritual do Círculo
chapter: 2
ambientTheme: explore
choices:
  - text: "Participar"
    next: act2/hub_catacomb
    preview: "Aceitar o cinza — ou hesitar e recuar."
    timedMs: 12000
    fallbackNext: act2/circle_ritual/circle_ritual_refuse_mind
    effects:
      - { op: addResource, resource: corruption, delta: 1 }
      - { op: addRep, faction: circulo, delta: 1 }
      - { op: advanceDay }
  - text: "Cantar o refrão como devoto do Círculo"
    next: act2/hub_catacomb
    condition: { rep: { faction: circulo, gte: 2 } }
    preview: "Mais cinza, mais eco — o dia avança."
    effects:
      - { op: addResource, resource: corruption, delta: 1 }
      - { op: addRep, faction: circulo, delta: 1 }
      - { op: grantTemporaryBuff, attr: mind, delta: 1, remainingScenes: 2 }
      - { op: advanceDay }
  - text: "Recusar"
    next: act2/circle_ritual/circle_ritual_refuse_mind
    preview: "Mente — manter a clareza ao recusar (TN 8)"
onEnter: []
---
Um mago do **Círculo** desenha cinza no chão. "Um preço leve", diz.
