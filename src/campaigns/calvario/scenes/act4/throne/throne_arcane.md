---
id: act4/throne/throne_arcane
title: Runas sob o pulso verde
chapter: 4
ambientTheme: explore
skillCheck:
  id: throne_arcane_read
  attr: mind
  tn: 11
  successNext: act4/throne/throne_arcane_ok
  failNext: act4/throne/throne_arcane_fail
  label: "Ler o padrão sem deixar o trono entrar"
choices: []
onEnter:
  - { op: setFlag, key: throne_acted_arcane, value: true }
---
As runas **não brilham** — **latem**. Se desviares o olhar, elas reorganizam-se como **dedos** numa garganta.
