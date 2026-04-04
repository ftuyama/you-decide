---
id: act6/reality_trial
title: Prova da Realidade
chapter: 6
ambientTheme: void
artKey: fractured_nave
skillCheck:
  id: act6_reality_focus
  attr: mind
  tn: 11
  successNext: act6/encounters/reality_trial_focus
  failNext: act6/encounters/reality_trial_shatter
choices:
  - text: "Tentar fixar um unico mundo com a mente"
    next: act6/encounters/reality_trial_focus
    preview: "Sem fixar a tempo, o véu parte."
    timedMs: 12000
    fallbackNext: act6/encounters/reality_trial_shatter
  - text: "Fechar os olhos e aceitar o colapso"
    next: act6/encounters/reality_trial_shatter
onEnter: []
---
Os espelhos não mostram o teu rosto: mostram versões de ti que fizeram escolhas mais fáceis. Numa delas, nunca entraste no Calvário. Noutra, foste amado por todos e lembrado por ninguém.

No centro do corredor, um arauto de véu metálico inclina a cabeça:

> *"Real não é o que existe. Real é o que insiste."*

Ele abre as mãos e o chão fica líquido por um instante. Só fica de pé quem decide qual dor merece ser chamada de verdade.

