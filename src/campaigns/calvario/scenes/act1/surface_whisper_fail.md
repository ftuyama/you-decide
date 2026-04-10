---
id: act1/surface_whisper_fail
title: Ruído que corrói
chapter: 1
ambientTheme: explore
artKey: crawl
choices:
  - text: "Afastar o ouvido e voltar às inscrições"
    next: act1/title_examine
onEnter:
  - { op: setFlag, key: act1_surface_whisper_done, value: true }
  - { op: addResource, resource: corruption, delta: 1 }
  - { op: addMark, mark: act1_surface_whisper_taint }
  - { op: addDiary, text: "O que subiu não era conversa — era riso partido que entrou na minha boca sem convite." }
---
A pedra **devolve** um riso que não é teu — húmido, **doce**, errado. Ficas com o eco na língua como **ferro** velho: não és pior, mas o subsolo **experimentou** o teu gosto.
