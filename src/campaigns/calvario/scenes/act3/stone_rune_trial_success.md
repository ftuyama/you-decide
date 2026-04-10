---
id: act3/stone_rune_trial_success
title: Ritmo Domado
chapter: 3
ambientTheme: act3
artKey: rune_resonance
onEnter:
  - { op: grantTemporaryBuff, attr: mind, delta: 1, remainingScenes: 2 }
  - { op: setFlag, key: stone_rune_trial_done, value: true }
  - { op: addMark, mark: act3_rune_tuned }
  - { op: addDiary, text: "Sintonizei o pulso das runas; por pouco tempo, penso com mais clareza." }
choices:
  - text: "Retomar o corredor"
    next: act3/stone_corridor
---
O brilho das runas baixa um tom. O peso no crânio alivia, e cada som da tumba parece chegar em ordem.
