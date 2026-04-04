---
id: act5/frost_summit_ritual_pacified
title: Selos fechados
chapter: 5
ambientTheme: frost_mystery
artKey: frost_summit_ritual
choices:
  - text: "Aceitar o recuo dos deuses — e sair dali"
    next: act5/frost_summit_temple_gate
onEnter:
  - { op: addResource, resource: corruption, delta: -2 }
  - { op: addDiary, text: "Os selos fecharam a tempo. Senti o vazio recuar — não como vitória, como trégua." }
---
Por um **instante** — longo o bastante para doer — o templo fica **quieto** de verdade. Não é paz; é **acordo** imposto a algo que preferia **fome**.

A corrupção em ti **arrefece**, como brasas pisadas. Não ganhaste coroa nem relíquia — ganhaste **margem**. E margem, na montanha, às vezes vale mais que **ouro**.
