---
id: act2/faction/circulo_envoy
title: Cinza viva — Círculo
chapter: 2
ambientTheme: explore
choices:
  - text: "Deixar o Círculo fechar um símbolo favorável"
    condition: { rep: { faction: circulo, gte: 2 } }
    next: act2/hub_catacomb
    effects:
      - { op: grantTemporaryBuff, attr: mind, delta: 1, remainingScenes: 3 }
      - { op: addDiary, text: "O cinza arrepiou na palma e depois acalmou — empréstimo do Círculo, com juro em silêncio." }
    preview: "Bónus temporário · MEN"
  - text: "Rasgar o desenho antes que feche"
    condition: { rep: { faction: circulo, lte: -2 } }
    effects:
      - op: startCombat
        encounterId: faction_circle_initiate
        onVictory: act2/hub_catacomb
        onFlee: act2/hub_catacomb
        onDefeat: shared/game_over
    preview: "Combate · adepto osso"
  - text: "Voltar ao cruzeiro"
    next: act2/hub_catacomb
onEnter:
  - { op: setFlag, key: act2_faction_envoy_circulo_done, value: true }
---
**Cinza** sobe do chão como **respiração** de quem já morreu uma vez e gostou do silêncio.

*"O Círculo **empresta** forma", diz uma voz. "Quem **rasga** paga em sangue barato."*
