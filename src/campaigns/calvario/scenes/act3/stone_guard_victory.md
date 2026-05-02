---
id: act3/stone_guard_victory
title: O Guardião Cede
chapter: 3
ambientTheme: act3
artKey: stone_guard_fallen
onEnter:
  - { op: setFlag, key: stone_guard_defeated, value: true }
  - { op: grantItem, itemId: depths_chart }
  - { op: addDiary, text: "O guardião tombou; as runas da passagem perderam o pulso." }
choices:
  - text: "Voltar ao núcleo"
    next: act3/hub_depths
---
A pedra **racha** num estalo seco. O corredor cala-se, como se a própria tumba aceitasse a tua passagem.
