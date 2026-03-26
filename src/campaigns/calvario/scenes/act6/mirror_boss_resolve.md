---
id: act6/mirror_boss_resolve
title: Costura da Sombra
chapter: 6
ambientTheme: void
artKey: mirror_chamber
choices:
  - text: "Aceitar a fissura e seguir"
    next: act6/epilogue
onEnter:
  - { op: addMark, mark: act6_shadow_faced }
  - { op: addDiary, text: "Não destruí minha sombra. Dei-lhe um nome e um limite." }
---
O reflexo desfaz-se em fios negros que não te atacam. Eles procuram abrigo no contorno do teu corpo, como uma capa feita de tudo o que negaste.

Não há triunfo limpo. Só um pacto lúcido: caminhar com a escuridão em coleira curta.

