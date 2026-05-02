---
id: act6/camp/void_tomas_fireside
title: Cinza — palavra com Tomás
chapter: 6
ambientTheme: void
artKey: fractured_nave
choices:
  - text: "Perguntar se a fé dele soa diferente aqui"
    next: act6/camp/void_tomas_topic_faith
    effects:
      - { op: adjustCompanionFriendship, companionId: squire_tomas, delta: 2, onceFlag: ff_cf_act6_void_tomas_fs_faith }
  - text: "Falar de dever quando o chão não promete firmeza"
    next: act6/camp/void_tomas_topic_duty
    effects:
      - { op: adjustCompanionFriendship, companionId: squire_tomas, delta: 2, onceFlag: ff_cf_act6_void_tomas_fs_duty }
  - text: "Voltar à roda da chama falsa"
    next: act6/camp/void_companion_chat
    effects:
      - { op: adjustCompanionFriendship, companionId: squire_tomas, delta: -3, onceFlag: ff_cf_act6_void_tomas_fs_leave }
onEnter: []
---
**Tomás** apoia o escudo na cinza que não espalha calor.

> *"Isto não é campo", diz baixo. "É **prova**. E prova não pede aplausos — pede passos."*

---

{{companionLine}}
