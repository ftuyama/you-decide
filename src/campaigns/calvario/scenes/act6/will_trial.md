---
id: act6/will_trial
title: Prova da Vontade
chapter: 6
ambientTheme: combat
choices:
  - text: "Recusar a coroa de sombra e lutar"
    effects:
      - { op: addResource, resource: supply, delta: -1 }
      - { op: startCombat, encounterId: act6_penitent_blade, onVictory: act6/will_after, onDefeat: act4/game_over, onFlee: act6/hub_fractured_nave }
onEnter: []
---
No alto do altar, uma coroa de espinhos de obsidiana gira lentamente, esperando um rei cansado o bastante para chamá-la de destino.

Um penitente sem rosto segura uma lâmina sem metal. A voz dele vem de dentro da tua armadura:

> *"Queres poder para proteger, ou para nunca mais tremer?"*

Escolher é perder uma versão tua para sempre.

