---
id: act4/morvayn_interlude
chapter: 4
title: Trégua mentirosa
choices:
  - text: "Fazer uma última varredura ao salão"
    next: act4/throne_sweep
  - text: "Enterrar o medo na mente (+Mente, 3 cenas)"
    next: act4/fight_morvayn_2
    effects:
      - { op: grantTemporaryBuff, attr: mind, delta: 1, remainingScenes: 3 }
      - { op: addDiary, text: "Antes da segunda fase, cerrei o eco como armadura invisível." }
  - text: "Endurecer o corpo (+FOR, 3 cenas)"
    next: act4/fight_morvayn_2
    effects:
      - { op: grantTemporaryBuff, attr: str, delta: 1, remainingScenes: 3 }
      - { op: addDiary, text: "O trono treme — eu também, mas por escolha." }
  - text: "Não dar tempo ao osso de respirar (sem buff)"
    next: act4/fight_morvayn_2
onEnter: []
---
Morvayn **vacila** — não por fraqueza, por **teatro**. O trono **respira** através dele, e tu sentes o ar a ficar **contagioso** como doença de catedral.

Tens um **instante** para decidir *como* carregas o próximo assalto: na **cabeça**, no **osso**, ou na **pressa** cega.
