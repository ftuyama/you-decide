---
id: act4/seal_ending
title: Final do Selo
chapter: 4
ambientTheme: explore
dualAttrSkillCheck:
  id: seal_calvario
  attrs: [mind, str]
  tn: 13
  rounds: 2
  successNext: act4/passage_graywind_heights
  failNext: act4/seal_ending_fail
  label: "Dois batimentos do selo — mente e ferro"
choices: []
onEnter:
  - { op: addResource, resource: faith, delta: -2 }
  - { op: addMark, mark: calvario_sealed }
---
Selas a **Masmorra do Silêncio** com preço. Cicatrizes na alma; paz frágil nas pedras.

O selo pede mais do que sangue: dois **impulsos** seguidos — primeiro a **mente** a
aguentar o sino a rebentar por dentro, depois o **corpo** a não ceder quando o peso
cai sobre os ossos como pedra.
