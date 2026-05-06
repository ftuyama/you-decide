---
id: act3/corruption_event
title: Pulso de Corrupção
chapter: 3
ambientTheme: act3
artKey: corruption_event
choices:
  - text: "Tocar o cristal"
    preview: "Deixar o pulso entrar — a masmorra assina em ti."
    next: act3/hub_depths
    effects:
      - { op: addResource, resource: corruption, delta: 1 }
  - text: "Recuar antes que o pulso te encontre de todo"
    preview: "O corpo fica a zumbir; o preço é nervo, não pele."
    next: act3/hub_depths
    effects:
      - { op: adjustLeadStress, delta: 1 }
  - text: "Ignorar de costas voltadas — fingir que o verde não existe"
    preview: "Nada muda no mapa; talvez mude em ti."
    next: act3/hub_depths
onEnter: []
---
Um **cristal** verde pulsa. O eco da masmorra responde — um pulso que não pede permissão para falar baixo.

O ar **vibra** nos dentes; por um instante, **Morvayn** soa como palavra de contagem, não como nome — como se alguém no fundo **medisse** quantos corações ainda batem a favor da negação.
