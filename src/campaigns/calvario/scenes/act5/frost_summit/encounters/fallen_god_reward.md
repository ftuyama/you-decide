---
id: act5/frost_summit/encounters/fallen_god_reward
title: Deus caído
chapter: 5
ambientTheme: ancient_macabre
artKey: frost_summit_fallen
choices:
  - text: "Sair do cume — com o peso novo no peito"
    next: act5/frost_summit/temple_gate
onEnter:
  - { op: addMark, mark: title_fallen_god }
  - { op: grantItem, itemId: fallen_god_amulet }
  - { op: equipItem, itemId: fallen_god_amulet, partyIndex: 0 }
  - { op: addDiary, text: "Venci um ecos do panteão. O título não aquece — mas o amuleto arde onde a corrupção morde." }
---
O silêncio, depois da queda, não é **consolo**. É **contrato** lido em voz baixa. Algo em ti **fica** com o nome errado no lugar certo: **deus caído** — não promessa, **título** que pesa.

No relógio do peito, o **amuleto** pulsa quando a corrupção **lateja**: faminto, **útil**, perigoso. Não perdoa — **alimenta-se**.
