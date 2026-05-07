---
id: shared/kaelsworn_post_act5
title: Ferro na geada
chapter: 5
ambientTheme: act5
repeatOnEnter:
  - { op: setFlag, key: kr_won_act5, value: true }
onEnter:
  - { op: addDiary, text: "À porta do hálito branco, Kael limou o gelo do ombro como quem limpa um nome. Três batidas contadas — o ferro quis falar." }
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
      - { op: setFlag, key: kr_oath_from_act5, value: true }
      - { op: setFlag, key: kr_oath_from_act6, value: false }
    next: shared/kaelsworn_oath
  - text: "Recuar ao acampamento — o covil espera"
    next: act5/frost_lair_approach
---
**Vapor** **rói** o **aço**; **Kael** **ri** **baixo**, **som** de **pedra** **molhada**.

> *"O **frio** **testa** **junta**. Tu **passaste**. **Falta** **saber** se **aceitas** **o** **que** **junta** **exige**."*
