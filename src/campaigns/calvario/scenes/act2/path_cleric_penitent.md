---
id: act2/path_cleric_penitent
chapter: 2
title: Clérigo penitente
onEnter:
  - { op: setPath, path: penitent }
  - { op: learnSpell, spellId: pilgrims_benediction }
  - { op: addDiary, text: "A Vigília pede provas; eu ofereço cicatrizes que já rezei em voz baixa." }
choices:
  - text: "Voltar ao cruzeiro"
    next: act2/hub_catacomb
---
O incenso **queima** mais fino quando a culpa **respira** contigo. Não és menos servo — és **mais** verdadeiro do que o salmo permite.
