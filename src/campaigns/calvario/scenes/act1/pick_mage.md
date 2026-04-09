---
id: act1/pick_mage
title: Juramento do Mago
chapter: 1
ambientTheme: explore
artKey: pick_mage
choices:
  - text: "Avançar para a boca da masmorra"
    next: act1/dungeon_mouth
    effects:
      - { op: initClass, class: mage }
      - { op: addRep, faction: circulo, delta: 1, directGain: true }
onEnter: []
---
Símbolos acendem na retina. O **Círculo Cinzento** não perdoa hesitação.