---
id: act2/camp/camp_mira_topic_vigilia
title: Vigília ao pé do fogo
chapter: 2
ambientTheme: camp
choices:
  - text: "Concordar em mudar de assunto"
    next: act2/camp/camp_mira_fireside
    effects:
      - { op: adjustCompanionFriendship, companionId: rogue_mira, delta: 2, onceFlag: ff_cf_act2_camp_mira_topic_vigilia }
onEnter: []
---
> *"A Vigília gosta de **ordem**", murmura Mira. "Ordem é história escrita por quem sobreviveu ao primeiro apagão. Eu não sou dessa página — mas o teu fogo **precisa** de quem saiba ler sombras."*

Ela ergue o queixo para os soldados ao fundo.

> *"Não confies neles. Usa-os. É diferente."*
---

{{companionLine}}
