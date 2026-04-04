---
id: act2/encounters/rats_combat_intro
chapter: 2
ambientTheme: explore
artKey: rats
title: Antes do salto
choices:
  - text: "Lutar!"
    effects:
      - op: startCombat
        encounterId: rats_cellar
        onVictory: act2/after_rats
        onDefeat: act4/game_over
        onFlee: act2/flee_rats
onEnter: []
---
O chão **vibra** — não de medo teu, mas de **garras** a escavar pedra mole.

Os ratos **não fogem**. Avançam em arco, como se alguém os ensinara **formação**.

Aperta os dentes. Os **dados** vão contar o que a carne não quer admitir.
