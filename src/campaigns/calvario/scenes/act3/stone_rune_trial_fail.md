---
id: act3/stone_rune_trial_fail
title: Eco nos Ossos
chapter: 3
ambientTheme: act3
artKey: rune_resonance
onEnter:
  - { op: grantTemporaryBuff, attr: agi, delta: -1, remainingScenes: 2 }
  - { op: setFlag, key: stone_rune_trial_done, value: true }
  - { op: addMark, mark: act3_rune_jarred }
  - { op: addDiary, text: "Falhei no compasso das runas; as pernas tremem com um atraso maldito." }
choices:
  - text: "Recuar e recuperar o folego"
    next: act3/stone_corridor
---
A resposta da parede vem como um choque seco pelos tendoes. Os teus passos ficam um meio-tempo atrasados.
