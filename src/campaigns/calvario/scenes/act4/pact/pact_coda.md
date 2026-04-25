---
id: act4/pact/pact_coda
title: Coda do Pacto
chapter: 4
ambientTheme: explore
choices:
  - text: "Aceitar o que ficou escrito em ti"
    next: act4/epilogue_modular
onEnter:
  - { op: addResource, resource: corruption, delta: 3 }
  - { op: addMark, mark: pact_bound }
  - { op: grantItem, itemId: third_bell }
  - { op: addDiary, text: "Servi ao Terceiro Sino. O anel no dedo não toca — mas o mundo aprendeu a calar quando eu respiro." }
---
O caçador cai ou foge; a cidade **aprende** a fingir adormecida.

Servis ao **Terceiro Sino** como **conduto** — batida sem torre, porque a torre **soubeste** tu. O **anel** no dedo: **mudo** para os outros, ensurdecedor para ti.

O frio sobe à pele da cidade; o dia chega **obediente** — e ouves o quarto toque **prometido**, nunca fundido.
