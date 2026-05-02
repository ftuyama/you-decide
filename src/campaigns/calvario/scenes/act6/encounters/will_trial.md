---
id: act6/encounters/will_trial
title: Prova da Vontade
chapter: 6
ambientTheme: void
artKey: void_altar
choices:
  - text: "Submeter o impulso ao acaso do altar"
    effects:
      - op: startWildEncounterFromGraph
        graphId: act6_will_trial
  - text: "Forcar confronto direto contra o penitente"
    preview: "Ferro imediato — ou hesitar e deixar o altar decidir."
    effects:
      - { op: addMark, mark: act6_will_direct }
      - { op: addResource, resource: supply, delta: -1 }
      - { op: startCombat, encounterId: act6_penitent_blade, onVictory: act6/will_after, onDefeat: shared/game_over, onFlee: act6/hub_fractured_nave }
onEnter: []
---
No alto do altar, uma coroa de espinhos de obsidiana gira lentamente, esperando um rei cansado o bastante para chamá-la de destino.

Um penitente sem rosto segura uma lâmina sem metal. A voz dele vem de dentro da tua armadura:

> *"Queres poder para proteger, ou para nunca mais tremer?"*

Escolher é perder uma versão tua para sempre.

