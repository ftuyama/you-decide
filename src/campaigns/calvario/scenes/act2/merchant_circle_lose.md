---
id: act2/merchant_circle_lose
chapter: 2
ambientTheme: merchant
artKey: merchant
title: Preço fora do bolso
onEnter: []
choices:
  - text: "Aceitar a perda e voltar ao cruzeiro"
    next: act2/hub_catacomb
    effects:
      - { op: addResource, resource: gold, delta: -2 }
      - { op: addDiary, text: "Os símbolos exigiram mais do que sussurrei — duas moedas saíram, e ficou um frio que não é de ouro." }
---
O padrão **escorrega** um **símbolo** tarde demais. Algo **puxa** do bolso — **não** é mão humana.

Quando voltas a **ver** claro, faltam **duas moedas** e sobra **eco** de riso **molhado** sob o capuz.
