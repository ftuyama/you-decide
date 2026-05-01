---
id: act2/path_mage_dark
chapter: 2
ambientTheme: act2
title: Mago das trevas
onEnter:
  - { op: setPath, path: dark }
  - { op: learnSpell, spellId: whisper_cache }
  - { op: addDiary, text: "Rasguei o véu do anjo caído; os símbolos seguros ficaram pequenos. Carrego os outros no sangue e no silêncio." }
choices:
  - text: "Voltar ao cruzeiro"
    next: act2/hub_catacomb
---
A **luz partida** do anjo **alimenta** o que trazes: a Torre **mede** luz, a masmorra **ensina** o que ela não paga. O teu caderno ganha **margens** que não aprovam em scriptorium.
