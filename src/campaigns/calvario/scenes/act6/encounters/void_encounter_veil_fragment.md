---
id: act6/encounters/void_encounter_veil_fragment
title: Véu e lasca
chapter: 6
ambientTheme: void
choices:
  - text: "Quebrar a dupla antes que o fragmento vire dogma"
    effects:
      - op: startCombat
        encounterId: act6_wild_veil_fragment
        onVictory: act6/hub_fractured_nave
        onDefeat: shared/game_over
        onFlee: act6/hub_fractured_nave
onEnter: []
---
O **Escrivão** traça; a **lasca** obedece — não como servo, como **nota de rodapé** viva ao teu medo.

Juntos, fecham um círculo que não pede permissão para **existir**.
