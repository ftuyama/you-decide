---
id: act2/camp/camp_tomas_fireside
title: Brasas — palavra com Tomás
chapter: 2
ambientTheme: camp
artKey: vigilia_camp
choices:
  - text: "Perguntar se o escudo ainda pesa"
    next: act2/camp/camp_tomas_topic_shield
  - text: "Falar da ordem que deixou de existir"
    next: act2/camp/camp_tomas_topic_oath
    effects:
      - { op: addMark, mark: tomas_camp_oath }
  - text: "Voltar à roda da fogueira"
    next: act2/camp/camp_companion_chat
onEnter: []
---
**Tomás** apoia o escudo na terra como quem afirma um limite. "Se vieste por pena, poupa saliva. Se vieste por **palavra**, fala — o fogo não vai interromper por educação."

---

{{companionLine}}
