---
id: act2/lore/lore_penitent_recall_success
title: Confissão que fica
chapter: 2
ambientTheme: explore
choices:
  - text: "Regressar ao cruzeiro"
    next: act2/hub_catacomb
onEnter:
  - { op: addResource, resource: faith, delta: 1 }
  - { op: addDiary, text: "Cada pedra aqui confessa melhor do que eu." }
---
A lembrança **assenta** — não como vitória, mas como **verdade** que aguentas sem mentir para ti próprio.