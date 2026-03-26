---
id: act4/throne_arcane_fail
title: Letra que morde
chapter: 4
ambientTheme: explore
choices:
  - text: "Soltar o olhar e voltar à ante-sala"
    next: act4/throne_gate
    effects:
      - { op: addResource, resource: corruption, delta: 1 }
      - { op: addDiary, text: "A runa mordeu-me o pensamento — ficou um buraco onde devia haver ordem." }
onEnter: []
---
A linha **parte-te** ao meio: não é falta de inteligência — é **convite** demais. O trono ri **sem som**, e tu sentes o eco como **azia** sagrada.
