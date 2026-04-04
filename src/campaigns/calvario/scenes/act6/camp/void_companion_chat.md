---
id: act6/camp/void_companion_chat
chapter: 6
ambientTheme: void
artKey: fractured_nave
title: Palavra ao pé da chama falsa
choices:
  - text: "Ouvir Mira — voz contra o eco"
    next: act6/camp/void_mira_fireside
    condition: { companionInParty: rogue_mira }
  - text: "Ouvir Tomás — escudo contra o vazio"
    next: act6/camp/void_tomas_fireside
    condition: { companionInParty: squire_tomas }
  - text: "Ficar entre os dois — três respirações, uma chama"
    next: act6/camp/void_duo_fireside
    condition:
      all:
        - { companionInParty: rogue_mira }
        - { companionInParty: squire_tomas }
  - text: "Voltar à fogueira"
    next: act6/camp/void_camp
onEnter: []
---
{{companionLine}}

Se estiveres só, o silêncio duplica a voz que já carregas dentro. Aqui, até o eco parece cansado de repetir mentiras.
