---
id: act6/encounters/will_trial_duel
title: Duelo da Coroa Vazia
chapter: 6
ambientTheme: void
artKey: void_altar
choices:
  - text: "Sustentar o duelo e pagar o preco"
    effects:
      - { op: addResource, resource: supply, delta: -1 }
      - { op: startCombat, encounterId: act6_penitent_blade, onVictory: act6/will_after, onDefeat: act4/game_over, onFlee: act6/hub_fractured_nave }
onEnter: []
---
O altar escolhe silencio. Apenas o Penitente avanca, como se cada passo dele fosse uma palavra que nao pode ser desdita.

