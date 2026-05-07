---
id: act4/throne/throne_sweep_hidden_treasure
title: Tesouro enterrado no osso
chapter: 4
ambientTheme: explore
artKey: throne_sweep
choices:
  - text: "Guardar o fragmento e voltar ao salão"
    next: act4/throne/throne_sweep
onEnter:
  - { op: grantItem, itemId: morvayn_heart_shard }
  - { op: addXp, amount: 16 }
  - { op: addDiary, text: "Num corte escondido do trono, encontrei um fragmento vivo: lateja como memória afiada." }
---
Entre costelas petrificadas, descobres um **nódulo negro** preso em ferro antigo. Ao tocá-lo, o salão muda de peso; algo em ti aprende um ritmo novo.

Não é ouro. É um **fragmento de vontade** arrancado ao trono.
