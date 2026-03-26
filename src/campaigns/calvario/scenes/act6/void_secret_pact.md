---
id: act6/void_secret_pact
title: Liturgia da Fenda
chapter: 6
ambientTheme: void
artKey: mirror_chamber
skillCheck:
  id: act6_void_pact_bind
  attr: mind
  tn: 12
  successNext: act6/void_secret_claim
  failNext: act6/void_secret_claim
choices:
  - text: "Aceitar o pacto e gravar o selo no corpo"
    next: act6/void_secret_claim
onEnter:
  - { op: addResource, resource: corruption, delta: 1 }
---
Um espelho opaco sobe do chao e escreve teu nome com a tua propria sombra. A oferta e simples: converter dor em forca, turno apos turno.

Nao ha testemunha, so custo.

