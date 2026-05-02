---
id: act5/camp/frost_tomas_fireside
title: Gelo — palavra com Tomás
chapter: 5
ambientTheme: camp
artKey: frost_camp
choices:
  - text: "Perguntar se a corda ainda lhe roía a palma"
    next: act5/camp/frost_tomas_topic_rope
  - text: "Falar do templo como de um campo de batalha"
    next: act5/camp/frost_tomas_topic_temple
  - text: "Voltar à roda da fogueira"
    next: act5/camp/frost_companion_chat
    effects:
      - { op: adjustCompanionFriendship, companionId: squire_tomas, delta: -3, onceFlag: ff_cf_act5_frost_tomas_fireside_leave }
onEnter: []
---
**Tomás** esfrega as mãos sem drama; o escudo perto, **segunda pele**. **Mesma** ferida, **outro** teto.

> *"Montanha não é inimigo — inimigo é **confundir** cansaço com sinal de Deus."* A sombra no metal lembra: **postura** também é máscara.
---

{{companionLine}}
