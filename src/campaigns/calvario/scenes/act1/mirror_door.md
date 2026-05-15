---
id: act1/mirror_door
title: Bronze nos batentes
chapter: 1
ambientTheme: explore
choices:
  - text: "Desviar o olhar e voltar aos batentes"
    next: act1/dungeon_door
  - text: "Mirar o espelho até o reflexo ceder"
    condition: { noFlag: act1_mirror_dialogue_done }
    effects:
      - op: startCombat
        encounterId: act1_mirror_dialogue
        onVictory: act1/mirror_descent
        onDefeat: shared/game_over
        onFlee: act1/mirror_door
onEnter: []
---
Na madeira, **bronze polido** devolve o teu rosto **esverdeado** num ângulo só — armadura ou capa parece **emprestada** a outrem.

O corredor e o reflexo **respiram juntos**; por um segundo não sabes quem empurra quem para dentro.
