---
id: act4/seal_ending
title: Final do Selo
chapter: 4
ambientTheme: explore
skillCheck:
  id: seal_calvario
  attr: mind
  tn: 12
  successNext: act4/passage_graywind_heights
  failNext: act4/seal_ending_fail
  label: "Sustentar o selo até o último eco"
choices: []
onEnter:
  - { op: addResource, resource: faith, delta: -2 }
  - { op: addMark, mark: calvario_sealed }
---
Selas a **Masmorra do Silêncio** com preço. Cicatrizes na alma; paz frágil nas pedras.

O selo pede mais do que sangue: pede que a tua mente não rache quando o sino
rebenta por dentro.
