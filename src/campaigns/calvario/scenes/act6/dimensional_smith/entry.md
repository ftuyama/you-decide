---
id: act6/dimensional_smith/entry
title: Corredor da Bigorna Cega
chapter: 6
ambientTheme: void
artKey: dimensional_smith_entry
choices:
  - text: "Entrar pelo corte da parede e seguir o som"
    next: act6/dimensional_smith/unlock
  - text: "Voltar para as colunas antes de ser notado"
    next: shared/explore_nav_act6
onEnter:
  - { op: addDiary, text: "Ouvi martelo onde não havia oficina; o vazio decidiu fundir alguma coisa em mim." }
---
Uma fenda corta a parede da nave.

Lá dentro: **ferro, pausa, ferro**. Sem brasa. Sem fole.
