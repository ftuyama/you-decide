---
id: shared/kaelsworn_post_act4
title: Ferro no limiar
chapter: 4
ambientTheme: explore
repeatOnEnter:
  - { op: setFlag, key: kr_won_act4, value: true }
onEnter:
  - { op: addDiary, text: "No limiar do vento cinzento, Kael curvou-se o tempo de um batimento. O trono ficou atrás; o rasto, à frente." }
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
      - { op: setFlag, key: kr_oath_from_act2, value: false }
      - { op: setFlag, key: kr_oath_from_act4, value: true }
      - { op: setFlag, key: kr_oath_from_act5, value: false }
      - { op: setFlag, key: kr_oath_from_act6, value: false }
    next: shared/kaelsworn_oath
  - text: "Afastar-te rumo ao gelo"
    next: act4/passage_graywind_heights
---
**Kael** **ancora** a **espada** na **sombra** do **passo** — **não** como **ameaça**, como **marco**.

> *"O **eixo** **dobra**; eu **não**. **Conta** **de novo**."*
