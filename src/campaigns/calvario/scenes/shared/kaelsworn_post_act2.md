---
id: shared/kaelsworn_post_act2
title: Ferro que cede
chapter: 2
ambientTheme: act2
repeatOnEnter:
  - { op: setFlag, key: kr_won_act2, value: true }
onEnter:
  - { op: addDiary, text: "Kael recuou na sala dos ossos — não por medo, por medida. O rasto cinzento ficou no chão como promessa adiada." }
choices:
  - text: "Ouvir o que o ferro promete — juramento"
    condition:
      all:
        - { noFlag: kaelsworn_recruited }
        - { companionCount: { lte: 1 } }
        - any:
            - all: [{ flag: kr_won_act2 }, { flag: kr_won_act4 }, { flag: kr_won_act5 }]
            - all: [{ flag: kr_won_act2 }, { flag: kr_won_act4 }, { flag: kr_won_act6 }]
            - all: [{ flag: kr_won_act2 }, { flag: kr_won_act5 }, { flag: kr_won_act6 }]
            - all: [{ flag: kr_won_act4 }, { flag: kr_won_act5 }, { flag: kr_won_act6 }]
    effects:
      - { op: setFlag, key: kr_oath_from_act2, value: true }
      - { op: setFlag, key: kr_oath_from_act4, value: false }
      - { op: setFlag, key: kr_oath_from_act5, value: false }
      - { op: setFlag, key: kr_oath_from_act6, value: false }
    next: shared/kaelsworn_oath
  - text: "Afastar-te — há porta e há pressa"
    next: act2/skeleton_room
---
**Kael** inclina o elmo; o metal **respira** como quem **guarda** frase para **depois**.

> *"Não foi vitória — foi **contagem**. Quando o **número** **fechar**, o **ferro** **fala**."*
