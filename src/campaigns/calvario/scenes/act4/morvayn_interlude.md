---
id: act4/morvayn_interlude
chapter: 4
ambientTheme: explore
title: Trégua mentirosa
choices:
  - text: "Fazer uma última varredura ao salão"
    next: act4/throne/throne_sweep
  - text: "Enterrar o medo na mente (+Mente, 3 cenas)"
    next: act4/throne/throne_sweep
    effects:
      - { op: grantTemporaryBuff, attr: mind, delta: 1, remainingScenes: 3 }
      - { op: addDiary, text: "Antes da segunda fase, cerrei o eco como armadura invisível e li o salão com calma." }
  - text: "Endurecer o corpo (+FOR, 3 cenas)"
    next: act4/throne/throne_sweep
    effects:
      - { op: grantTemporaryBuff, attr: str, delta: 1, remainingScenes: 3 }
      - { op: addDiary, text: "O trono treme — eu também, mas por escolha. Cada passo mede o próximo golpe." }
  - text: "Aceitar o custo do selo e respirar fundo (-Mente, +foco cruel)"
    next: act4/throne/throne_sweep
    effects:
      - { op: grantTemporaryBuff, attr: mind, delta: -1, remainingScenes: 3 }
      - { op: addDiary, text: "Em vez de correr, aceitei o tremor. A clareza veio com dor." }
  - text: "Forçar a segunda fase agora (atalho sem explorar)"
    next: act4/encounters/fight_morvayn_2
onEnter: []
---
Morvayn **vacila** — não por fraqueza, por **teatro**. O trono **respira** através dele, e tu sentes o ar a ficar **contagioso** como doença de catedral.

Tens um **instante** para decidir *como* carregas o próximo assalto: na **cabeça**, no **osso**, ou na **pressa** cega.
