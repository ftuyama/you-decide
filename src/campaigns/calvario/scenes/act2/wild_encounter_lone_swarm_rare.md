---
id: act2/wild_encounter_lone_swarm_rare
chapter: 2
ambientTheme: explore
title: Ninho rompido
choices:
  - text: "Pisotear o enxame isolado"
    effects:
      - op: startCombat
        encounterId: act2_rare_lone_swarm
        onVictory: act2/hub_catacomb
        onDefeat: act4/game_over
        onFlee: act2/flee_rats
onEnter: []
---
Debaixo das tábuas soltas, um **enxame** sem toca corre em círculos, ferido e furioso. A fome dele ainda morde como um coro inteiro.
