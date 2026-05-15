---
id: act2/faction/vigilia_envoy_verbal_win
title: Farol distante — palavra
chapter: 2
ambientTheme: camp
choices:
  - text: "Voltar ao cruzeiro"
    next: act2/hub_catacomb
onEnter:
  - { op: addRep, faction: vigilia, delta: 1 }
  - { op: addDiary, text: "[RASCUNHO] O capeador cedeu o passo — disciplina sem sangue desta vez." }
---
[RASCUNHO] A lanterna **abaixa** um dedo. Não há aperto de pulso — há **trégua** de quartel, fria como **metal** ao **relento**.
