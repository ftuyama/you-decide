---
id: act2/recruit_offer
title: A Oferta de Mira
chapter: 2
ambientTheme: act2
artKey: mira_offer
highlight: true
choices:
  - text: "Recrutar Mira"
    next: act2/recruit_mira
    condition: { not: { rep: { faction: circulo, gte: 2 } } }
    showWhenLocked: true
    lockedHint: "Com o Círculo demasiado dentro de ti (rep ≥2), este convite fecha-se — usa a outra linha."
    preview: "Compromisso na sombra — ou o silêncio decide."
    timedMs: 12000
    fallbackNext: act2/hub_catacomb
    effects:
      - { op: recruit, companionId: rogue_mira }
      - { op: addRep, faction: circulo, delta: 1 }
  - text: "Recrutar Mira com o Círculo a testemunhar"
    next: act2/recruit_mira
    condition: { rep: { faction: circulo, gte: 2 } }
    showWhenLocked: true
    lockedHint: "Só quando o Círculo confia em ti o suficiente (rep ≥2) podes assinar com testemunhas."
    preview: "A rede cobra visibilidade — a Vigília desconfia."
    timedMs: 12000
    fallbackNext: act2/hub_catacomb
    effects:
      - { op: recruit, companionId: rogue_mira }
      - { op: addRep, faction: circulo, delta: 1 }
      - { op: addRep, faction: vigilia, delta: -1, directGain: true }
      - { op: addDiary, text: "Mira riu baixinho: o Círculo gosta quando alguém assina em cinza." }
  - text: "Seguir sozinho"
    next: act2/hub_catacomb
onEnter: []
---
**Mira** observa das sombras: "Preciso de alguém que não tema o silêncio."