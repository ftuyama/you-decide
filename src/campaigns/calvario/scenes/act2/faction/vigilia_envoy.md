---
id: act2/faction/vigilia_envoy
title: Farol distante — Vigília
chapter: 2
ambientTheme: camp
choices:
  - text: "Aceitar o sal militar e o aperto de pulso"
    condition: { rep: { faction: vigilia, gte: 2 } }
    next: act2/hub_catacomb
    effects:
      - { op: grantTemporaryBuff, attr: agi, delta: 1, remainingScenes: 4 }
      - { op: addDiary, text: "Um capeador fechou o meu pulso como quem fecha uma porta — e disse ordem sem querer sermão." }
    preview: "Bónus temporário · AGI"
  - text: "Responder insulto com a lâmina"
    condition: { rep: { faction: vigilia, lte: -2 } }
    effects:
      - op: startCombat
        encounterId: vigil_hunter_fight
        onVictory: act2/hub_catacomb
        onFlee: act2/hub_catacomb
        onDefeat: shared/game_over
    preview: "Combate · caçador"
  - text: "Recuar para o cruzeiro"
    next: act2/hub_catacomb
onEnter:
  - { op: setFlag, key: act2_faction_envoy_vigilia_done, value: true }
---
Um **capeador** inclina a lanterna. O metal não brilha — **acusa**.

*"Quem o subsolo nomeia, a Vigília **repete** em voz mais baixa."*
