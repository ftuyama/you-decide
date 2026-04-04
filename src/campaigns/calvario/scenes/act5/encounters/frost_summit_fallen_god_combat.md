---
id: act5/encounters/frost_summit_fallen_god_combat
title: O trono responde
chapter: 5
ambientTheme: boss
artKey: frost_summit_fallen
choices:
  - text: "Encarar o que desceu do panteão"
    effects:
      - op: startCombat
        encounterId: summit_fallen_god
        onVictory: act5/encounters/frost_summit_fallen_god_reward
        onDefeat: act5/encounters/frost_summit_fallen_god_curse
        onFlee: act5/frost_summit_temple_gate
onEnter: []
---
Um **ruído** antigo — não trovão, mas **memória** com dentes — rasga o ar. Do altar levanta-se uma **forma** que já foi número antes de ter rosto: **ecos** do panteão quebrado, famintos de **nome** e de **medida**.

Se fugires, o templo **lembra**. Se ficares, o templo **cobre**.
