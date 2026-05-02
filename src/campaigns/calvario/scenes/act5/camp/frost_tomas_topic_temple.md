---
id: act5/camp/frost_tomas_topic_temple
title: Templo no gelo
chapter: 5
ambientTheme: camp
choices:
  - text: "Voltar ao calor do acampamento"
    next: act5/camp/frost_tomas_fireside
    effects:
      - { op: addDiary, text: "Tomás falou do cume como de uma linha — não de glória, mas de dever. O escudo dele continua a fazer sombra maior do que ele admite." }
      - { op: adjustCompanionFriendship, companionId: squire_tomas, delta: 2, onceFlag: ff_cf_act5_frost_tomas_topic_temple }
onEnter: []
---
> *"Pedra negra não é moral", murmura Tomás. "É **peso**. O templo vai pedir joelhos — eu dou joelhos por hábito, não por teatro. Se lá dentro houver vozes, lembra-te: eco não é ordem."*

Ele bate leve no escudo.

> *"Eu entro primeiro quando o chão for duvidoso. Não por bravura — por **medida**."*
---

{{companionLine}}
