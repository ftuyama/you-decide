---
id: act3/lore/cult_negotiate_verbal_fail
title: Pacto sem altar (ferro)
chapter: 3
ambientTheme: act3
artKey: cult_negotiate
choices:
  - text: "[!] Ferro antes de palavra"
    effects:
      - op: setFlag
        key: act3_negotiate_done
        value: true
      - op: startCombat
        encounterId: cultist_patrol
        onVictory: act3/hub_depths
        onDefeat: shared/game_over
        onFlee: act3/hub_depths
    preview: "Combate imediato; sem barganha."
onEnter: []
---
[RASCUNHO] A barganha **rompe**. O encarregado assobia entre dentes; atrás dele, o cano lembra que **silêncio** também tem **dente**.
