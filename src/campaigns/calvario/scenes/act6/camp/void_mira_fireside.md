---
id: act6/camp/void_mira_fireside
title: Cinza — confidências com Mira
chapter: 6
ambientTheme: void
artKey: fractured_nave
choices:
  - text: "Perguntar se ela ainda reconhece a própria sombra"
    next: act6/camp/void_mira_topic_mirror
    effects:
      - { op: adjustCompanionFriendship, companionId: rogue_mira, delta: 2, onceFlag: ff_cf_act6_void_mira_fs_mirror }
  - text: "Falar do fim como de uma porta, não de um poço"
    next: act6/camp/void_mira_topic_end
    effects:
      - { op: addMark, mark: mira_void_endtalk }
      - { op: adjustCompanionFriendship, companionId: rogue_mira, delta: 2, onceFlag: ff_cf_act6_void_mira_fs_endtalk }
  - text: "Voltar à roda da chama falsa"
    next: act6/camp/void_companion_chat
    effects:
      - { op: adjustCompanionFriendship, companionId: rogue_mira, delta: -3, onceFlag: ff_cf_act6_void_mira_fs_leave }
onEnter: []
---
**Mira** observa a chama que não consome madeira — e mesmo assim recua, hábito de sobrevivente.

> *"Aqui o eco **mente** menos que as pessoas. Isso não é conforto: é **aviso**."*

---

{{companionLine}}
