---
id: act2/camp/camp_companion_chat
chapter: 2
ambientTheme: act2
title: Palavra ao lado do fogo
choices:
  - text: "Ouvir Mira sem a pedra julgar"
    next: act2/camp/camp_mira_fireside
    condition: { companionInParty: rogue_mira }
  - text: "Sentar junto ao escudo de Tomás"
    next: act2/camp/camp_tomas_fireside
    condition: { companionInParty: squire_tomas }
  - text: "Mira cruza contigo um olhar de quem reconhece muralha no ombro"
    next: act2/camp/camp_mira_fireside
    condition: { all: [ { companionInParty: rogue_mira }, { class: knight } ] }
  - text: "Mira mede o teu silêncio de arcanista — não julga, anota"
    next: act2/camp/camp_mira_fireside
    condition: { all: [ { companionInParty: rogue_mira }, { class: mage } ] }
  - text: "Mira: «A Vigília fala alto; tu ouves baixo demais para ser só dogma»"
    next: act2/camp/camp_mira_fireside
    condition: { all: [ { companionInParty: rogue_mira }, { class: cleric } ] }
  - text: "Tomás: «Honra pesada empurra gente para buracos — estás inteiro?»"
    next: act2/camp/camp_tomas_fireside
    condition: { all: [ { companionInParty: squire_tomas }, { class: knight } ] }
  - text: "Tomás hesita: «Torre e masmorra — qual das duas te come primeiro?»"
    next: act2/camp/camp_tomas_fireside
    condition: { all: [ { companionInParty: squire_tomas }, { class: mage } ] }
  - text: "Tomás baixa a voz: «Fé de vigia é coisa séria; não a uses como muro»"
    next: act2/camp/camp_tomas_fireside
    condition: { all: [ { companionInParty: squire_tomas }, { class: cleric } ] }
  - text: "Voltar ao acampamento"
    next: act2/camp/vigilia_camp
onEnter: []
---
{{companionLine}}

*Alguém murmura o número — **dia {{day}}** — como quem confessa idade.*

O fogo não pede **permissão** — mas pede testemunhas. Se estiveres só, as brasas cuspirão para o vazio e mesmo assim parecerá conversa.
