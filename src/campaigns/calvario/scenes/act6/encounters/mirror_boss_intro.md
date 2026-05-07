---
id: act6/encounters/mirror_boss_intro
title: O Outro Nome
chapter: 6
ambientTheme: void
artKey: act6_mirror_final
highlight: true
choices:
  - text: "Lutar contra o meu reflexo soberano"
    effects:
      - op: startCombat
        encounterId: act6_shadow_self
        onVictory: act6/encounters/mirror_boss_resolve
        onDefeat: shared/game_over
        onFlee: act6/hub_fractured_nave
onEnter: []
---
Do espelho sai alguém com o teu rosto e a tua postura, mas sem hesitação. Ele sorri como quem já ganhou todas as discussões com a própria consciência.

> *"Eu sou tu sem medo. Tu és eu sem coragem."*

Se ele vencer, vais continuar vivo. Só não vais continuar **sendo**.

