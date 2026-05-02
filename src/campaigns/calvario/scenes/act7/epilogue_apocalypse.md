---
id: act7/epilogue_apocalypse
title: Epílogo — cinzas com nome
chapter: 7
ambientTheme: ash_sky
artKey: last_horizon
choices:
  - text: "Fechar o diário — o fim também cansa"
    next: endings/epilogue_depths
onEnter:
  - { op: registerEnding, endingId: epilogue_apocalypse }
  - { op: addDiary, text: "O apocalipse não terminou — só ficou mais honesto: cinza com nome, vento com conta, e eu no meio a aprender a respirar sem pedir licença ao céu." }
---
O mundo **continua** sem ti; o teu **eco** reparte-se entre **estrada**, **marca** e **silêncio** comprado ou recusado.

Sobra **testemunho** — o que resta quando até o céu aprende a **sussurrar**. *(Podes **salvar** no menu ou **recomeçar**.)*
