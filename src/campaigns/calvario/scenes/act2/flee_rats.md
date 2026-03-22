---
id: act2/flee_rats
chapter: 2
title: Fuga — dentes na bota
choices:
  - text: "Meter medo ao medo e voltar ao cruzeiro"
    next: act2/hub_catacomb
onEnter:
  - { op: addResource, resource: supply, delta: -1 }
  - { op: addMark, mark: fled_rats }
  - { op: addDiary, text: "Fugi dos ratos. O chão lembrou-se do meu sabor — e eu deixei rasto." }
---
Escorregas num **lodo** que não perdoa passos. **Mordidas** rasgam couro onde a armadura não chega — não é honra; é **sobrevivência**.

O enxame **ri** em agudos — ou talvez só o teu ouvido **quebre** primeiro.
