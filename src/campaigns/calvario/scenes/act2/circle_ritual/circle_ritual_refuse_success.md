---
id: act2/circle_ritual/circle_ritual_refuse_success
title: Sem assinatura
chapter: 2
ambientTheme: act2
choices:
  - text: "Voltar ao cruzeiro"
    next: act2/hub_catacomb
onEnter:
  - { op: addResource, resource: faith, delta: 1 }
  - { op: addXp, amount: 12 }
---
A cinza **para** aos teus pés — não fica nada escrito em ti. O silêncio, desta vez, é **teu**.