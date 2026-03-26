---
id: act6/memory_trial
title: Prova da Memória
chapter: 6
ambientTheme: combat
choices:
  - text: "Mergulhar no poço e enfrentar o coro de ecos"
    effects:
      - { op: addResource, resource: corruption, delta: 1 }
      - { op: startCombat, encounterId: act6_echo_chorus, onVictory: act6/memory_after, onDefeat: act4/game_over, onFlee: act6/hub_fractured_nave }
onEnter: []
---
No poço, vês cenas da tua vida em camadas, como sonhos dentro de sonhos. Quando tentas tocar uma lembrança, outra acorda por baixo dela e pergunta quem escreveu a primeira.

Vozes infantis, velhas e feridas cantam o teu nome com tons diferentes, sem decidir qual é o verdadeiro.

O coro sobe do fundo:

> *"Recordar é escolher o que matar."*

