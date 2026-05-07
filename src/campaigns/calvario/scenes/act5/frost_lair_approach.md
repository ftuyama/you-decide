---
id: act5/frost_lair_approach
title: Aproximação ao Covil de Gelo
chapter: 5
ambientTheme: act5
artKey: ice_dragon
highlight: true
choices:
  - text: "Entrar na câmara do hálito branco"
    next: act5/encounters/fight_ice_dragon
  - text: "Voltar o rosto ao vento — o rasto cinzento espera"
    condition:
      all:
        - { noFlag: kaelsworn_recruited }
        - { noFlag: kr_won_act5 }
    preview: "Encontro especial: Kael, o Rastreador Cinzento."
    effects:
      - op: startCombat
        encounterId: kael_rival_act5
        onVictory: shared/kaelsworn_post_act5
        onFlee: act5/frost_lair_approach
        onDefeat: shared/game_over
  - text: "Retornar ao acampamento"
    next: act5/frost_hub
onEnter:
  - { op: addDiary, text: "O covil não cheira a enxofre — cheira a tempestade adiada. Vetrnax dorme acordado." }
---
**Gelo** espelha o rosto em fatias — nenhuma **inteira**; no fundo, **dentes** de inverno abrem sorriso que não é para ti.

O ar vira **agulhas**; o céu hesita em cair, como quem segura um **segredo** demasiado pesado.
