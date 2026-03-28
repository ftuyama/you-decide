---
id: act3/flee_cult
chapter: 3
ambientTheme: act3
title: Fuga — capuzes a rir
choices:
  - text: "Reagrupar nas profundezas"
    next: act3/hub_depths
onEnter:
  - { op: addResource, resource: supply, delta: -2 }
  - { op: addResource, resource: corruption, delta: 1 }
  - { op: addRep, faction: vigilia, delta: -1 }
  - { op: addDiary, text: "Fugi da emboscada. O eco do Terceiro Sino ficou-me na nuca como unha suja." }
---
Os **capuzes** não correm — **flutuam**. Tu corres como quem tem **pulmões** ainda humanos.

Uma **lâmina** corta o ar perto demais da orelha; outra **risca** o teu orgulho sem tocar na pele — humilhação é arma deles.
