---
id: act2/encounters/wild_encounter_cultist
chapter: 2
ambientTheme: act2
title: Patrulha solitária
choices:
  - text: "Sussurrar o nome do Terceiro Sino — comprar silêncio mútuo"
    condition:
      all:
        - { rep: { faction: culto, gte: 5 } }
        - { noFlag: act2_wild_cultist_favor }
    next: shared/explore_nav_act2
    effects:
      - { op: setFlag, key: act2_wild_cultist_favor, value: true }
      - { op: addResource, resource: gold, delta: 4 }
      - { op: addXp, amount: 16 }
      - { op: addDiary, text: "O cultista fechou os olhos como quem ouve distância; quando abriu, já não estava ali — só o rumor de moeda." }
    preview: "Sem combate · ouro e XP (uma vez)"
  - text: "Bater no cultista isolado"
    effects:
      - op: startCombat
        encounterId: cultist_patrol
        onVictory: shared/explore_nav_act2
        onDefeat: shared/game_over
        onFlee: shared/explore_nav_act2
onEnter: []
---
Um **cultista** demasiado confiante separa-se do coro. A voz dele **treme** — não de medo, de **êxtase** barato.
