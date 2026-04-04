---
id: act1/crawl_entrada
title: Primeiro degrau
chapter: 1
ambientTheme: explore
artKey: crawl
choices:
  - text: "Aceitar o chamado e seguir"
    next: act1/class_gate
    preview: "Escolha de classe e primeiro passo firme."
    effects:
      - { op: addDiary, text: "Entrei no Calvário." }
  - text: "Um caco de espelho brilha na argamassa — ver o próprio rosto"
    next: act1/mirror_descent
    preview: "Rota do espelho; descida simbólica antes da classe."
  - text: "Tocar na parede: está fria ou úmida?"
    next: act1/crawl_touch
    preview: "Detalhe tátil; eco de humidade e medo."
onEnter: []
---
Pedra fria sob a palma. A umidade **não é água** — é algo que escorreu de cima há séculos e nunca secou de todo.

Cada degrau consome um pouco de **luz**; a tocha da superfície já parece memória de outra vida.
