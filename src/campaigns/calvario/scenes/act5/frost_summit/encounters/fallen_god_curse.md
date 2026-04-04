---
id: act5/frost_summit/encounters/fallen_god_curse
title: Maldição do trono
chapter: 5
ambientTheme: ancient_macabre
artKey: frost_summit_fallen
choices:
  - text: "Arrastar-me para fora do templo — vivo, mas oco"
    next: act5/frost_summit/temple_gate
onEnter:
  - { op: grantTemporaryBuff, attr: str, delta: -4, remainingScenes: 14 }
  - { op: grantTemporaryBuff, attr: agi, delta: -4, remainingScenes: 14 }
  - { op: grantTemporaryBuff, attr: mind, delta: -4, remainingScenes: 14 }
  - { op: addDiary, text: "Perdi para o ecos — e o templo deixou-me uma maldição que não se confessa, só se carrega." }
---
A derrota não vem só em **ferida**. Vem em **forma** — uma **mão** no espelho interior que te puxa para baixo, **três vezes** e em **três frentes**: corpo, reflexo, vontade.

Levantas porque o **medo** ainda empurra — mas o mundo, por um tempo, **nega-te** facilidade. Cada passo é **prova**. Cada pensamento é **custo**.
