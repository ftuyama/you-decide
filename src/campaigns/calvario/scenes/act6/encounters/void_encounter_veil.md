---
id: act6/encounters/void_encounter_veil
title: Escrivão entre espelhos mortos
chapter: 6
ambientTheme: void
choices:
  - text: "Responder ao escrivão antes que costure o céu à tua garganta"
    effects:
      - op: startCombat
        encounterId: act6_wild_scribe_solo
        onVictory: shared/explore_nav_act6
        onDefeat: shared/game_over
        onFlee: shared/explore_nav_act6
onEnter: []
---
Uma figura **alta** atravessa a penumbra como quem **escreve** no ar — não há sangue, há **certeza** a escorrer dos cantos do véu; **tinta** onde devia haver pele.

A voz não pergunta se estás pronto. Trata **prontidão** como defeito de criança.
