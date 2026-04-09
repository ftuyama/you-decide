---
id: act6/encounters/memory_trial_safe
title: Lastro de Nome
chapter: 6
ambientTheme: void
artKey: void_well
choices:
  - text: "Mergulhar com o eco sob controle"
    effects:
      - { op: startCombat, encounterId: act6_echo_chorus, onVictory: act6/memory_after, onDefeat: shared/game_over, onFlee: act6/hub_fractured_nave }
onEnter:
  - { op: addMark, mark: act6_memory_kept }
  - { op: addDiary, text: "Repito meu nome como quem finca estaca num mar sem margem." }
---
Escolhes um nome para te prender ao presente. Funciona por um momento, e um momento basta para encarar o abismo com espinha reta.

