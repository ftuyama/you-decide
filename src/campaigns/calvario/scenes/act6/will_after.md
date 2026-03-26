---
id: act6/will_after
title: Juramento sem Testemunhas
chapter: 6
ambientTheme: void
artKey: void_altar
choices:
  - text: "Descer para a nave fraturada"
    next: act6/hub_fractured_nave
onEnter:
  - { op: setFlag, key: act6_will_done, value: true }
  - { op: addDiary, text: "Vontade não é força para vencer todos. É disciplina para não obedecer o pior em mim." }
---
O penitente cai de joelhos, mas não sangra. Em vez disso, espalha um pó negro que escreve um círculo ao redor dos teus pés.

Dentro dele, percebes uma certeza nova: não és puro, mas ainda és teu.

