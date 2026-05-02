---
id: act5/frost_epilogue
title: Epílogo de Geada
chapter: 5
ambientTheme: act5
choices:
  - text: "Seguir o eco sob o gelo — atravessar o Umbral do Vazio"
    next: act6/opening_void_threshold
onEnter:
  - { op: registerEnding, endingId: frost_epilogue }
  - { op: grantItem, itemId: frost_wyrm_scale }
  - { op: addMark, mark: vetrnax_slain }
  - { op: addDiary, text: "Vetrnax caiu. O gelo partiu-se como vidro — e por baixo, por um instante, ouvi o Terceiro Sino a aprender um nome novo." }
---
**Vetrnax** vira **cascata**; o vento deixa de morder e **sussurra** ordem vazia — um instante em que o silêncio pesa mais que o rugido.

Na mão, **escama** que queima a frio: troféu que gosta de **virar** culpa. O rumor mudará — morto ou **dormindo** mais fundo.

Sabes a verdade **húmida**: cada vitória é **corda**; o Sino gosta de quem puxa sem queixar-se.
