---
id: act6/encounters/will_trial_horde
title: Coroa da Fome
chapter: 6
ambientTheme: void
artKey: void_altar
choices:
  - text: "Romper o cerco de ecos famintos"
    effects:
      - { op: addResource, resource: corruption, delta: 1 }
      - { op: startCombat, encounterId: act6_will_horde, onVictory: act6/will_after, onDefeat: shared/game_over, onFlee: act6/hub_fractured_nave }
onEnter:
  - { op: addMark, mark: act6_will_scattered }
  - { op: addDiary, text: "A vontade sem freio chamou versoes minhas que so conhecem conquista." }
---
A coroa parte-se em varios fragmentos e cada fragmento veste um rosto teu. Nao e mais duelo: e tribunal de sombras.

