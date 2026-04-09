---
id: act5/encounters/frost_stranded_traveler
title: Viajante na crevasse
chapter: 5
ambientTheme: act5
choices:
  - text: "Gastar corda e calor — puxar a mula para o salto"
    next: act5/frost_hub
    condition: { resource: { supply: { gte: 1 } } }
    effects:
      - { op: addResource, resource: supply, delta: -1 }
      - { op: addResource, resource: faith, delta: 1 }
      - { op: addDiary, text: "A neve não agradece — mas o viajante sim, com um olhar que não pede nome." }
    preview: "−1 suprimento · +1 fé"
  - text: "Cortar o alforje e seguir antes que grite"
    next: act5/frost_hub
    effects:
      - { op: addResource, resource: gold, delta: 6 }
      - { op: addResource, resource: corruption, delta: 1 }
      - { op: addRep, faction: vigilia, delta: -5, directGain: true }
      - { op: addDiary, text: "O gelo cobriu o grito; o ouro no bolso não aquece." }
    preview: "+6 ouro · +1 corrupção · Vigília −5"
onEnter:
  - { op: setFlag, key: frost_stranded_traveler_done, value: true }
---
Uma **mula** presa ao gelo — patas à mercê da crevasse, olho branco de pânico. O dono **morde** o lábio: *"Só preciso de corda e de alguém que ainda acredite em puxar."*

Ou acreditas — ou **cobras** o mundo por te não ter poupado.
