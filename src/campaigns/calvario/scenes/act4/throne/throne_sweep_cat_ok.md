---
id: act4/throne/throne_sweep_cat_ok
title: Mapa de osso
chapter: 4
ambientTheme: explore
artKey: throne_sweep
choices:
  - text: "À segunda fase — trono!"
    next: act4/encounters/fight_morvayn_2
    effects:
      - { op: grantTemporaryBuff, attr: agi, delta: 1, remainingScenes: 2 }
      - { op: addDiary, text: "Contei até o salão ficar pequeno — espaço é mentira quando sabes onde pisa." }
onEnter:
  - { op: addXp, amount: 10 }
---
O número **fecha** um círculo: não és mais visitante — és **medida** dentro da sala.
