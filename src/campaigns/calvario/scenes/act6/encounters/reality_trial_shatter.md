---
id: act6/encounters/reality_trial_shatter
title: Fenda Sem Eixo
chapter: 6
ambientTheme: void
artKey: fractured_nave
choices:
  - text: "Lutar mesmo com a fe em queda"
    effects:
      - { op: addResource, resource: faith, delta: -1 }
      - { op: addResource, resource: corruption, delta: 1 }
      - { op: startCombat, encounterId: act6_veil_herald, onVictory: act6/reality_after, onDefeat: act4/game_over, onFlee: act6/hub_fractured_nave }
onEnter:
  - { op: addDiary, text: "Quando o real partiu, a sombra entrou primeiro." }
---
As paredes trocam de lugar e o teu proprio corpo parece chegar atrasado a cada gesto. Pisar no chao vira um ato de fe.

O Arauto nao avanca. Ele espera a tua queda para chamar isso de prova.

