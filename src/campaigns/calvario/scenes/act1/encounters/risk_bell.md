---
id: act1/encounters/risk_bell
chapter: 1
ambientTheme: explore
artKey: dungeon_mouth_bell
title: Sino cego
choices:
  - text: "Sangrar na borda do sino para pactuar passagem"
    next: act1/dungeon_mouth
    effects:
      - { op: setFlag, key: act2_risk_bell_done, value: true }
      - { op: addResource, resource: corruption, delta: 1 }
      - { op: addXp, amount: 24 }
      - { op: addRep, faction: culto, delta: 1 }
      - { op: addDiary, text: "O sino bebeu sangue e devolveu poder. O Culto vai saber." }
    preview: "+XP e influência no Culto, com +corrupção."
  - text: "Cobrir o sino e seguir em silêncio"
    next: act1/dungeon_mouth
    effects:
      - { op: setFlag, key: act2_risk_bell_done, value: true }
      - { op: addRep, faction: vigilia, delta: 1, directGain: true }
      - { op: addDiary, text: "Cobri o sino e recusei o pacto. A Vigília chamaria isto de disciplina." }
    preview: "Ganho de reputação com a Vigília, sem corrupção."
---
Um **sino sem badalo** balança sozinho, preso por correntes finas. A boca de metal tem um brilho de carne fresca.

O eco pede uma oferta simples: um corte na palma, um voto de urgência, um atalho para descer mais forte.
