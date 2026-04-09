---
id: act3/messenger_combat_intro
title: Culto na toca
chapter: 3
ambientTheme: act3
choices:
  - text: "Cair sobre eles"
    effects:
      - op: startCombat
        encounterId: cultist_patrol
        onVictory: act3/messenger_payoff
        onDefeat: shared/game_over
        onFlee: act3/hub_depths
onEnter: []
---
O metal **acorda** antes de ti — não importa: já não há conversa que não seja **lâmina**.
