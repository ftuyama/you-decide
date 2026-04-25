---
id: act4/pact/pact_ascent_fail
title: Eco Fraturado
chapter: 4
ambientTheme: explore
choices:
  - text: "Falhar em silêncio e encarar Morvayn"
    next: act4/encounters/fight_morvayn
onEnter:
  - { op: grantTemporaryBuff, attr: str, delta: -1, remainingScenes: 4 }
  - { op: grantTemporaryBuff, attr: agi, delta: -1, remainingScenes: 4 }
  - { op: grantTemporaryBuff, attr: mind, delta: -1, remainingScenes: 4 }
  - { op: addDiary, text: "Perdi o compasso do Terceiro Sino. Subi quebrado, e Morvayn ouviu o estalo." }
---
O **Terceiro Sino** acerta por dentro como martelo em vidro.

Por um instante, sobes com os joelhos de outro corpo, o folego curto e a mente em
faíscas. A rua abre-se diante de ti — e Morvayn já está à espera, como se a tua falha
tivesse sido o convite.
