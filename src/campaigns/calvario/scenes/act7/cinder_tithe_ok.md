---
id: act7/cinder_tithe_ok
title: Sorte seca
chapter: 7
ambientTheme: ash_sky
artKey: cinder_heap
choices:
  - text: "Enfiar o achado no bolso e seguir"
    next: act7/before_final_horizon
onEnter:
  - { op: addMark, mark: act7_cinder_favored }
  - { op: addResource, resource: gold, delta: 4 }
  - { op: addDiary, text: "A cinza cedeu — um saquinho de ouro derretido que ainda fingia ser moeda. Não agradeci; agradecer puxa olhos." }
---
Escolhes o monte certo como quem **cheira** mentira no vento. Debaixo da cinza: **ouro** frio, derretido em formas inúteis — mas **ouro** mesmo assim.

---
