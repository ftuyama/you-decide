---
id: act1/surface_whisper_ok
title: Informação que paga
chapter: 1
ambientTheme: explore
artKey: crawl
choices:
  - text: "Guardar o rumor e voltar às inscrições"
    next: act1/title_examine
onEnter:
  - { op: setFlag, key: act1_surface_whisper_done, value: true }
  - { op: addResource, resource: gold, delta: 3 }
  - { op: addMark, mark: act1_surface_whisper_intel }
  - { op: addDiary, text: "Ouvi quem paga o vigário para não dizer o nome do morto — e anotei o dia do mercado." }
---
Apanhas **duas** palavras que valem moeda: **quem** fecha o armazém ao quarto toque e **onde** o vigário guarda o livro de dívida. Não é milagre — é **mapa**.
