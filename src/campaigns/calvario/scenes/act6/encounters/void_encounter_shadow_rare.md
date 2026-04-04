---
id: act6/encounters/void_encounter_shadow_rare
title: Regente sem trono
chapter: 6
ambientTheme: void
choices:
  - text: "Olhar de frente o regente de vidro quebrado"
    effects:
      - op: startCombat
        encounterId: act6_wild_regent_solo
        onVictory: act6/hub_fractured_nave
        onDefeat: shared/game_over
        onFlee: act6/hub_fractured_nave
onEnter: []
---
Por um **fio** de segundo, o ar **fica** contigo — não espelha; **reina** sobre cacos. O que se move não pede nome: **impõe** silêncio onde tu ainda **negociavas** com a dúvida.

Não é emboscada de narrativa. É **consequência** a pedir lugar.
