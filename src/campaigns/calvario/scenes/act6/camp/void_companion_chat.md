---
id: act6/camp/void_companion_chat
chapter: 6
ambientTheme: void
artKey: fractured_nave
title: Palavra ao pé da chama falsa
choices:
  - text: "Ouvir Mira — voz contra o eco"
    uiSection: "Ao pé do fogo"
    next: act6/camp/void_mira_fireside
    condition: { companionInParty: rogue_mira }
  - text: "Ouvir Tomás — escudo contra o vazio"
    uiSection: "Ao pé do fogo"
    next: act6/camp/void_tomas_fireside
    condition: { companionInParty: squire_tomas }
  - text: "Ficar entre os dois — três respirações, uma chama"
    uiSection: "Ao pé do fogo"
    next: act6/camp/void_duo_fireside
    condition:
      all:
        - { companionInParty: rogue_mira }
        - { companionInParty: squire_tomas }
  - text: "Mira: «Cavaleiro caído ou não — aqui o chão não distingue juramento»"
    uiSection: "Tu e eles"
    next: act6/camp/void_mira_fireside
    condition: { all: [ { companionInParty: rogue_mira }, { class: knight } ] }
  - text: "Mira: «Trevas honestas, disseste uma vez. O vazio cobra juros»"
    uiSection: "Tu e eles"
    next: act6/camp/void_mira_fireside
    condition: { all: [ { companionInParty: rogue_mira }, { class: mage } ] }
  - text: "Mira: «Penitência é peso; não o largues agora ou ficas leve demais»"
    uiSection: "Tu e eles"
    next: act6/camp/void_mira_fireside
    condition: { all: [ { companionInParty: rogue_mira }, { class: cleric } ] }
  - text: "Tomás: «O escudo lembra-me o teu ferro — ambos mentem que aguentam tudo»"
    uiSection: "Tu e eles"
    next: act6/camp/void_tomas_fireside
    condition: { all: [ { companionInParty: squire_tomas }, { class: knight } ] }
  - text: "Tomás: «Se o vazio ler o teu caderno, o que fica por escrever?»"
    uiSection: "Tu e eles"
    next: act6/camp/void_tomas_fireside
    condition: { all: [ { companionInParty: squire_tomas }, { class: mage } ] }
  - text: "Tomás: «Fé em sítio sem eco — é coragem ou hábito?»"
    uiSection: "Tu e eles"
    next: act6/camp/void_tomas_fireside
    condition: { all: [ { companionInParty: squire_tomas }, { class: cleric } ] }
  - text: "Voltar à fogueira"
    uiSection: "Voltar"
    next: act6/camp/void_camp
onEnter: []
---
{{companionLine}}

Se estiveres só, o silêncio duplica a voz que já carregas dentro. Aqui, até o eco parece cansado de repetir mentiras.
