---
id: act2/faction/culto_envoy
title: Carne de sino — Culto
chapter: 2
ambientTheme: explore
choices:
  - text: "Aceitar o preço do Terceiro Sino"
    condition: { rep: { faction: culto, gte: 2 } }
    next: act2/hub_catacomb
    effects:
      - { op: addResource, resource: faith, delta: 1 }
      - { op: addResource, resource: corruption, delta: 1 }
      - { op: addDiary, text: "O sino não tocou — e mesmo assim o ouvido sangrou de gratidão." }
    preview: "+1 fé, +1 corrupção"
  - text: "Cortar a oração ao meio"
    condition: { rep: { faction: culto, lte: -2 } }
    effects:
      - op: startCombat
        encounterId: cultist_patrol
        onVictory: act2/hub_catacomb
        onFlee: act2/hub_catacomb
        onDefeat: shared/game_over
    preview: "Combate · cultista"
  - text: "Afastar-se do rumor"
    next: act2/hub_catacomb
onEnter:
  - { op: setFlag, key: act2_faction_envoy_culto_done, value: true }
---
Um **sino** sem badalo vibra na **garganta** do túnel. A sombra **dobra** o joelho antes que tu o faças.

*"Devoto é quem **paga** o silêncio com outro silêncio."*
