---
id: act2/camp_companion_chat
chapter: 2
ambientTheme: explore
title: Palavra ao lado do fogo
choices:
  - text: "Ouvir Mira sem a pedra julgar"
    next: act2/camp_mira_fireside
    condition: { companionInParty: rogue_mira }
  - text: "Sentar junto ao escudo de Tomás"
    next: act2/camp_tomas_fireside
    condition: { companionInParty: squire_tomas }
  - text: "Voltar ao acampamento"
    next: act2/vigilia_camp
onEnter: []
---
{{companionLine}}

*Alguém murmura o número — **dia {{day}}** — como quem confessa idade.*

O fogo não pede **permissão** — mas pede testemunhas. Se estiveres só, as brasas cuspirão para o vazio e mesmo assim parecerá conversa.
