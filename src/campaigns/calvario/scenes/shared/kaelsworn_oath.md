---
id: shared/kaelsworn_oath
title: Juramento de cinza
chapter: 2
ambientTheme: explore
choices:
  - text: "Aceitar — espada a quem te venceu três vezes"
    condition: { all: [{ flag: kr_oath_from_act2 }, { companionCount: { lte: 1 } }] }
    effects:
      - { op: recruit, companionId: rival_kael }
      - { op: setFlag, key: kaelsworn_recruited, value: true }
      - { op: setFlag, key: kr_oath_from_act2, value: false }
      - { op: setFlag, key: kr_oath_from_act4, value: false }
      - { op: setFlag, key: kr_oath_from_act5, value: false }
      - { op: setFlag, key: kr_oath_from_act6, value: false }
      - { op: adjustCompanionFriendship, companionId: rival_kael, delta: 6, onceFlag: ff_cf_kaelsworn_oath_accept }
      - { op: addDiary, text: "Kael curvou a lâmina: não vassalo, sombra com peso. Três quedas dele viraram um nome ao meu lado." }
    next: act2/skeleton_room
  - text: "Aceitar — espada a quem te venceu três vezes"
    condition: { all: [{ flag: kr_oath_from_act4 }, { companionCount: { lte: 1 } }] }
    effects:
      - { op: recruit, companionId: rival_kael }
      - { op: setFlag, key: kaelsworn_recruited, value: true }
      - { op: setFlag, key: kr_oath_from_act2, value: false }
      - { op: setFlag, key: kr_oath_from_act4, value: false }
      - { op: setFlag, key: kr_oath_from_act5, value: false }
      - { op: setFlag, key: kr_oath_from_act6, value: false }
      - { op: adjustCompanionFriendship, companionId: rival_kael, delta: 6, onceFlag: ff_cf_kaelsworn_oath_accept }
      - { op: addDiary, text: "Kael curvou a lâmina: não vassalo, sombra com peso. Três quedas dele viraram um nome ao meu lado." }
    next: act4/passage_graywind_heights
  - text: "Aceitar — espada a quem te venceu três vezes"
    condition: { all: [{ flag: kr_oath_from_act5 }, { companionCount: { lte: 1 } }] }
    effects:
      - { op: recruit, companionId: rival_kael }
      - { op: setFlag, key: kaelsworn_recruited, value: true }
      - { op: setFlag, key: kr_oath_from_act2, value: false }
      - { op: setFlag, key: kr_oath_from_act4, value: false }
      - { op: setFlag, key: kr_oath_from_act5, value: false }
      - { op: setFlag, key: kr_oath_from_act6, value: false }
      - { op: adjustCompanionFriendship, companionId: rival_kael, delta: 6, onceFlag: ff_cf_kaelsworn_oath_accept }
      - { op: addDiary, text: "Kael curvou a lâmina: não vassalo, sombra com peso. Três quedas dele viraram um nome ao meu lado." }
    next: act5/frost_lair_approach
  - text: "Aceitar — espada a quem te venceu três vezes"
    condition: { all: [{ flag: kr_oath_from_act6 }, { companionCount: { lte: 1 } }] }
    effects:
      - { op: recruit, companionId: rival_kael }
      - { op: setFlag, key: kaelsworn_recruited, value: true }
      - { op: setFlag, key: kr_oath_from_act2, value: false }
      - { op: setFlag, key: kr_oath_from_act4, value: false }
      - { op: setFlag, key: kr_oath_from_act5, value: false }
      - { op: setFlag, key: kr_oath_from_act6, value: false }
      - { op: adjustCompanionFriendship, companionId: rival_kael, delta: 6, onceFlag: ff_cf_kaelsworn_oath_accept }
      - { op: addDiary, text: "Kael curvou a lâmina: não vassalo, sombra com peso. Três quedas dele viraram um nome ao meu lado." }
    next: act6/void_secret_entry
  - text: "Recusar — o ferro cala-se"
    condition: { flag: kr_oath_from_act2 }
    effects:
      - { op: setFlag, key: kr_oath_from_act2, value: false }
      - { op: setFlag, key: kr_oath_from_act4, value: false }
      - { op: setFlag, key: kr_oath_from_act5, value: false }
      - { op: setFlag, key: kr_oath_from_act6, value: false }
      - { op: adjustCompanionFriendship, companionId: rival_kael, delta: -8, onceFlag: ff_cf_kaelsworn_oath_decline }
    next: act2/skeleton_room
  - text: "Recusar — o ferro cala-se"
    condition: { flag: kr_oath_from_act4 }
    effects:
      - { op: setFlag, key: kr_oath_from_act2, value: false }
      - { op: setFlag, key: kr_oath_from_act4, value: false }
      - { op: setFlag, key: kr_oath_from_act5, value: false }
      - { op: setFlag, key: kr_oath_from_act6, value: false }
      - { op: adjustCompanionFriendship, companionId: rival_kael, delta: -8, onceFlag: ff_cf_kaelsworn_oath_decline }
    next: act4/passage_graywind_heights
  - text: "Recusar — o ferro cala-se"
    condition: { flag: kr_oath_from_act5 }
    effects:
      - { op: setFlag, key: kr_oath_from_act2, value: false }
      - { op: setFlag, key: kr_oath_from_act4, value: false }
      - { op: setFlag, key: kr_oath_from_act5, value: false }
      - { op: setFlag, key: kr_oath_from_act6, value: false }
      - { op: adjustCompanionFriendship, companionId: rival_kael, delta: -8, onceFlag: ff_cf_kaelsworn_oath_decline }
    next: act5/frost_lair_approach
  - text: "Recusar — o ferro cala-se"
    condition: { flag: kr_oath_from_act6 }
    effects:
      - { op: setFlag, key: kr_oath_from_act2, value: false }
      - { op: setFlag, key: kr_oath_from_act4, value: false }
      - { op: setFlag, key: kr_oath_from_act5, value: false }
      - { op: setFlag, key: kr_oath_from_act6, value: false }
      - { op: adjustCompanionFriendship, companionId: rival_kael, delta: -8, onceFlag: ff_cf_kaelsworn_oath_decline }
    next: act6/void_secret_entry
onEnter: []
---
**Kael** **tira** o **elmo**: rosto **cansado**, **olhar** **limpo**.

> *"**Três** **vezes** **caí**. **Três** **vezes** **tu** **não** **mentiste** **no** **golpe**. Isso **basta** **para** **um** **juramento** **meu**: **não** **te** **sirvo** **como** **cão** — **sirvo** **como** **ferro** **que** **aprendeu** **a** **dobrar** **só** **a** **tua** **mão**."*
