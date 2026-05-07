---
id: act6/dimensional_smith/unlock
title: A Forja Entre Dobradiças
chapter: 6
ambientTheme: void
artKey: dimensional_smith
choices:
  - text: "Falar. Aceitar a marca da oficina."
    next: act6/dimensional_smith/forge
    effects:
      - { op: setFlag, key: act6_dimensional_smith_unlocked, value: true }
      - { op: addDiary, text: "O ferreiro abriu a oficina com três palavras e um olhar torto." }
  - text: "Recuar para a nave fraturada"
    next: act6/hub_fractured_nave
onEnter: []
---
O ferreiro parece mais ruído que homem.

Ele bate metal invisível e para sem te olhar.

"**Pago. Troca. Some.**"

"Se voltares, traz metal que já viu o vazio."
