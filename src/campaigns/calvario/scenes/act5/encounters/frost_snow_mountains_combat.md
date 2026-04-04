---
id: act5/encounters/frost_snow_mountains_combat
title: Desfilada até à boca da gruta
chapter: 5
ambientTheme: frost_mystery
artKey: frost_monk_path
choices:
  - text: "Atravessar a crias de geada que defendem o caminho"
    effects:
      - op: startCombat
        encounterId: frost_whelps
        onVictory: act5/frost_snow_gruta_approach
        onDefeat: shared/game_over
        onFlee: act5/frost_hub
onEnter: []
---
O rumor não mentiu por completo: antes da pedra que parece **boca**, a montanha cobra um **pedágio** de dentes. Duas sombras pequenas cortam o branco — fome com forma, não com ideologia.

Se passares, não agradeces ao acaso. Agradece ao **teu** corpo por ainda saber **cair** em pé.
