---
id: act2/luck_mire_wound
chapter: 2
title: Mordida do poço
onEnter:
  - { op: adjustLeadStat, attr: agi, delta: -1 }
  - { op: addMark, mark: wound_mire_leg }
  - { op: addDiary, text: "O lodo mordeu-me a perna. O calor não volta igual." }
choices:
  - text: "Arrastar-se de volta ao cruzeiro"
    next: act2/hub_catacomb
---
Algo **raspa** tendão e **confiança** ao mesmo tempo. Não é só dor — é **advertência** gravada na **ágil** postura que tinhas.
