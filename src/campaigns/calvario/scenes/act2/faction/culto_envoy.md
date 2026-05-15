---
id: act2/faction/culto_envoy
title: Carne de sino — Culto
chapter: 2
ambientTheme: act2
choices:
  - text: "Confessar devedor de alto grau — o sino cobra e paga"
    condition:
      all:
        - { rep: { faction: culto, gte: 5 } }
        - { noFlag: act2_culto_envoy_high_favor }
    next: act2/hub_catacomb
    effects:
      - { op: setFlag, key: act2_culto_envoy_high_favor, value: true }
      - { op: addResource, resource: gold, delta: 5 }
      - { op: addXp, amount: 20 }
      - { op: addResource, resource: corruption, delta: 1 }
      - { op: addDiary, text: "O enviado contou até dez em silêncio e devolveu-me o juro em moeda e em sombra." }
    preview: "Ouro, XP e corrupção · favor do culto (uma vez)"
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
        encounterId: act2_culto_envoy_dialogue
        onVictory: act2/faction/culto_envoy_verbal_win
        onDefeat: act2/faction/culto_envoy_blades
        onFlee: act2/hub_catacomb
    preview: "Confronto verbal (rascunho); falha leva ao combate."
  - text: "Afastar-se do rumor"
    next: act2/hub_catacomb
onEnter:
  - { op: setFlag, key: act2_faction_envoy_culto_done, value: true }
---
Um **sino** sem badalo vibra na **garganta** do túnel. A sombra **dobra** o joelho antes que tu o faças.

*"Devoto é quem **paga** o silêncio com outro silêncio."*
