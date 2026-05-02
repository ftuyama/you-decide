---
id: act2/circle_ritual/circle_ritual
title: Ritual do Círculo
chapter: 2
ambientTheme: act2
choices:
  - text: "Participar"
    next: act2/hub_catacomb
    condition: { noFlag: act2_circle_ritual_tribute_done }
    preview: "Aceitar o cinza — ou hesitar e recuar."
    effects:
      - { op: setFlag, key: act2_circle_ritual_tribute_done, value: true }
      - { op: addResource, resource: corruption, delta: 1 }
      - { op: addRep, faction: circulo, delta: 1 }
      - { op: advanceDay }
  - text: "Cantar o refrão como devoto do Círculo"
    next: act2/hub_catacomb
    condition:
      all:
        - { rep: { faction: circulo, gte: 2 } }
        - { noFlag: act2_circle_ritual_tribute_done }
    preview: "Mais cinza, mais eco — o dia avança."
    effects:
      - { op: setFlag, key: act2_circle_ritual_tribute_done, value: true }
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
