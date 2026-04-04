---
id: act4/encounters/pact_vigil_skirmish
title: Escaramuça da Vigília
chapter: 4
ambientTheme: explore
choices:
  - text: "Responder ao aço da Vigília"
    effects:
      - op: startCombat
        encounterId: vigil_hunter_fight
        onVictory: act4/pact/pact_coda
        onDefeat: shared/game_over
onEnter:
  - { op: addRep, faction: vigilia, delta: -1 }
  - { op: addDiary, text: "Um caçador da Vigília reconheceu o meu passo — não o meu rosto. O pacto cheira a traição para quem jura pela luz." }
---
Do lado da **sombra** de um chafariz, um arqueiro da **Vigília** corta-te o caminho. Não vem com sermão — vem com **certeza**.

"**Servo** não é cidadão", diz. "É **ferida** aberta na cidade."
