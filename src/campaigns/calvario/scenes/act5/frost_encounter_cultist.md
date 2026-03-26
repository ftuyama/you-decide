---
id: act5/frost_encounter_cultist
title: Estranho no gelo
chapter: 5
choices:
  - text: "Responder ao cultista perdido no desfiladeiro"
    effects:
      - op: startCombat
        encounterId: cultist_patrol
        onVictory: act5/frost_hub
        onDefeat: act4/game_over
        onFlee: act5/frost_hub
onEnter: []
---
Alguém **canta** baixo — não uma oração, um **compasso** que não combina com o vento. Os olhos dele já **venderam** o céu a outro sino. A neve agarra-se-lhe à barba como **cinza** benta; por baixo da pele, porém, há **fervura**.

Não é duelo de ideias — é **sorte** contra **fanatismo**. Um de vocês vai sair com o nome mais **barato**.
