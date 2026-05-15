---
id: act2/faction/vigilia_envoy_blades
title: Farol distante — ferro
chapter: 2
ambientTheme: camp
choices:
  - text: "Responder insulto com a lâmina"
    effects:
      - op: startCombat
        encounterId: vigil_hunter_fight
        onVictory: act2/hub_catacomb
        onFlee: act2/hub_catacomb
        onDefeat: shared/game_over
    preview: "Combate · caçador"
onEnter: []
---
[RASCUNHO] A conversa **fechou**. Sobra **contagem** — e o **caçador** já **mede** o teu **passo**.
