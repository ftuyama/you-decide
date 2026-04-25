---
id: act5/camp/frost_mira_fireside
title: Gelo — confidências com Mira
chapter: 5
ambientTheme: camp
artKey: frost_camp
choices:
  - text: "Perguntar se o frio lhe devolveu algo que perdeu"
    next: act5/camp/frost_mira_topic_pact
    effects:
      - { op: addMark, mark: mira_frost_pact }
  - text: "Falar do cume como quem fala de uma sentença"
    next: act5/camp/frost_mira_topic_summit
  - text: "Voltar à roda da fogueira"
    next: act5/camp/frost_companion_chat
onEnter: []
---
**Mira** usa o vento em vez de encolher-se; no fogo, o teu rosto **duplica** um instante — truque velho do subsolo.

> *"Neve **apaga pegadas**", diz. "Escolhe o que queres esquecer."*
---

{{companionLine}}
