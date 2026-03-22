---
id: act2/merchant_moon
chapter: 2
artKey: merchant
title: Mercador sem rosto
choices:
  - text: "Aceitar o mapa rasgado (−1 suprimento)"
    next: act2/hub_catacomb
    effects:
      - { op: grantItem, itemId: rumor_map }
      - { op: addResource, resource: supply, delta: -1 }
  - text: "Recusar educadamente"
    next: act2/hub_catacomb
  - text: "Perguntar de onde veio o mapa"
    next: act2/merchant_ask
onEnter: []
---
Um capuz **sem rosto** estende um **mapa** com margens roídas. Os dedos por baixo do tecido são **demasiado longos** para serem só humanos.

"Rumores mudam **pesos**", diz a voz — como se o ar saísse da própria pedra.
