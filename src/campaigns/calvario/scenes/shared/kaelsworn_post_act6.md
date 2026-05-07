---
id: shared/kaelsworn_post_act6
title: Ferro na nervura
chapter: 6
ambientTheme: void
repeatOnEnter:
  - { op: setFlag, key: kr_won_act6, value: true }
onEnter:
  - { op: addDiary, text: "Na nervura que o mapa nega, Kael tocou o peitoral como quem fecha livro. O vazio ouviu o ferro sem contestar." }
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
      - { op: setFlag, key: kr_oath_from_act4, value: false }
      - { op: setFlag, key: kr_oath_from_act5, value: false }
      - { op: setFlag, key: kr_oath_from_act6, value: true }
    next: shared/kaelsworn_oath
  - text: "Recuar para a nave fraturada"
    next: act6/void_secret_entry
---
**Kael** **parece** **menor** **contra** o **ângulo** **impossível** — **a** **armadura** **não**: **permanece** **reta**.

> *"Aqui **nem** **eco** **mente**. Se **juras**, **juras** **uma** **vez** **só** — **ou** **calas** **para** **sempre**."*
