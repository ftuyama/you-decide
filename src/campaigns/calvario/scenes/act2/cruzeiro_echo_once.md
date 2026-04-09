---
id: act2/cruzeiro_echo_once
title: Cera e cobre
chapter: 2
ambientTheme: explore
choices:
  - text: "Voltar ao cruzeiro"
    next: act2/hub_catacomb
onEnter:
  - { op: setFlag, key: act2_echo_done, value: true }
  - { op: addResource, resource: gold, delta: 1 }
  - { op: addDiary, text: "Arranquei uma moeda velha da cera — troco de quem rezou e fugiu." }
---
Entre **duas** velas gastas, a **cera** guardou uma **moeda** com o rosto raspado: nem patacão, nem mentira inteira — só prova de que alguém **pagou** para ficar um pouco mais quente.
