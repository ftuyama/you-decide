---
id: act4/throne_sweep_word_fail
title: Palavra que morde
chapter: 4
ambientTheme: explore
artKey: throne_sweep
choices:
  - text: "À segunda fase — trono!"
    next: act4/fight_morvayn_2
onEnter:
  - { op: addResource, resource: supply, delta: -1 }
  - { op: addDiary, text: "A palavra voltou como chicote — roubou-me fôlego e provisões." }
---
O vácuo **não perdoa** audácia mal calibrada. Pagas com **corpo** e bolsa.
