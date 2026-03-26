---
id: act6/void_secret_claim
title: Marca da Lamina Oca
chapter: 6
ambientTheme: void
artKey: mirror_chamber
choices:
  - text: "Voltar a nave fraturada com a marca ativa"
    next: act6/hub_fractured_nave
onEnter:
  - { op: setFlag, key: act6_void_pact, value: true }
  - { op: addMark, mark: act6_void_pact_mark }
  - { op: addDiary, text: "Aprendi um credo novo: sangrar para ferir melhor." }
---
O espelho toca teu peito por dentro. Fica uma linha escura sobre o esterno, quente como metal recem-forjado.

Quando fechas a mao, a marca responde.

