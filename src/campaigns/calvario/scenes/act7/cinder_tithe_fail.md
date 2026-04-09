---
id: act7/cinder_tithe_fail
title: Cinza que morde
chapter: 7
ambientTheme: ash_sky
artKey: cinder_burn
choices:
  - text: "Sair do monte com as mãos a arder e a boca fechada"
    next: act7/before_final_horizon
onEnter:
  - { op: addMark, mark: act7_cinder_burned }
  - { op: addResource, resource: supply, delta: -1 }
  - { op: addResource, resource: corruption, delta: 1 }
  - { op: addDiary, text: "A cinza estava viva — ou eu é que estava morto o suficiente para confundir. Perdi tempo e pele no mesmo sítio." }
---
A pilha **acende** sem chama: calor que **rouba** suor e **paciência**. Quando recuas, trazes **corrupção** na garganta — não possessão; **resíduo** de ter tocado o que não era teu.

---
