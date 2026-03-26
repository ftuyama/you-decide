---
id: act2/recruit_offer
title: A Oferta de Mira
chapter: 2
ambientTheme: explore
choices:
  - text: "Recrutar Mira"
    next: act2/recruit_mira
    effects:
      - { op: recruit, companionId: rogue_mira }
      - { op: addRep, faction: circulo, delta: 1 }
  - text: "Seguir sozinho"
    next: act2/hub_catacomb
onEnter: []
---
**Mira** observa das sombras: "Preciso de alguém que não tema o silêncio."