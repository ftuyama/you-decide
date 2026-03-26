---
id: act6/reality_trial
title: Prova da Realidade
chapter: 6
ambientTheme: combat
choices:
  - text: "Aceitar o corte: a verdade custa fé"
    effects:
      - { op: addResource, resource: faith, delta: -1 }
      - { op: startCombat, encounterId: act6_veil_herald, onVictory: act6/reality_after, onDefeat: act4/game_over, onFlee: act6/hub_fractured_nave }
onEnter: []
---
Os espelhos não mostram o teu rosto: mostram versões de ti que fizeram escolhas mais fáceis. Numa delas, nunca entraste no Calvário. Noutra, foste amado por todos e lembrado por ninguém.

No centro do corredor, um arauto de véu metálico inclina a cabeça:

> *"Real não é o que existe. Real é o que insiste."*

Ele abre as mãos e o chão fica líquido por um instante. Só fica de pé quem decide qual dor merece ser chamada de verdade.

