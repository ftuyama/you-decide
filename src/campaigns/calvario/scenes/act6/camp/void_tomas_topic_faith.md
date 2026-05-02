---
id: act6/camp/void_tomas_topic_faith
title: Fé no vazio
chapter: 6
ambientTheme: void
artKey: fractured_nave
choices:
  - text: "Deixar a oração ficar incompleta — e voltar"
    next: act6/camp/void_tomas_fireside
    effects:
      - { op: adjustCompanionFriendship, companionId: squire_tomas, delta: 2, onceFlag: ff_cf_act6_void_tomas_topic_faith }
onEnter: []
---
> *"A fé não muda de som", diz Tomás. "Muda de **eco**. Aqui o eco repete o que queres ouvir — por isso desconfio."*

Ele inspira devagar.

> *"Se Deus calar, eu continuo a levantar o escudo. Não é teatro. É **hábito** de quem ainda acredita em chão."*
---

{{companionLine}}
