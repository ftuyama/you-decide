---
id: act2/merchant_circle_win
chapter: 2
artKey: merchant
title: O capuz paga
onEnter:
  - { op: addResource, resource: gold, delta: 1 }
  - { op: addDiary, text: "O capuz inclinou-se: o Círculo pagou em moeda — desta vez os símbolos fecharam a favor." }
choices:
  - text: "Recolher o ouro e voltar ao cruzeiro"
    next: act2/hub_catacomb
---
Os símbolos **fecham** antes que a maldição **aperte**. Uma moeda **quente** cai na palma — **paga** do Círculo, não tua.

O mercador **não ri**. Só **assente**.
