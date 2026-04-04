---
id: act5/frost_companion_chat
chapter: 5
ambientTheme: act5
title: Palavra ao lado do fogo
choices:
  - text: "Ouvir Mira sem a neve decidir por ti"
    next: act5/frost_mira_fireside
    condition: { companionInParty: rogue_mira }
  - text: "Sentar ao lado de Tomás — escudo e tempestade"
    next: act5/frost_tomas_fireside
    condition: { companionInParty: squire_tomas }
  - text: "Ficar entre os dois — duas lâminas, um fogo"
    next: act5/frost_duo_fireside
    condition:
      all:
        - { companionInParty: rogue_mira }
        - { companionInParty: squire_tomas }
  - text: "Voltar ao acampamento gelado"
    next: act5/frost_camp
onEnter: []
---
{{companionLine}}

O vento ocupa o lugar do outro quando calas — e mesmo assim parece réplica de conversa. O céu baixo ajuda: ninguém exige bravura quando o frio parece ter opinião.
