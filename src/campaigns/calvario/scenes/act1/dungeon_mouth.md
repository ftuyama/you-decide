---
id: act1/dungeon_mouth
title: Boca da masmorra
chapter: 1
ambientTheme: explore
artKey: dungeon_mouth
highlight: true
choices:
  - text: "Braseiro rachado — arrancar o selo (risco/recompensa)"
    next: act1/encounters/risk_brazier
    condition: { noFlag: act2_risk_brazier_done }
    preview: "Pode render recurso raro, mas drena convicção."
  - text: "Sino cego — prometer sangue ao eco (risco/recompensa)"
    next: act1/encounters/risk_bell
    condition: { noFlag: act2_risk_bell_done }
    preview: "Ganho imediato em poder, com custo visível."
  - text: "Entrar na catacumba"
    next: act2/catacomb_entry
    effects:
      - { op: setChapter, chapter: 2 }
      - { op: addResource, resource: supply, delta: -1 }
  - text: "Inspeccionar os batentes da porta"
    next: act1/dungeon_door
onEnter: []
---
A **boca de pedra** range como mandíbula velha. O ar torna-se **denso**, como lã molhada a entrar pelos pulmões — e o **silêncio** da câmara parece **ouvir-te** antes de tu ouvires a ti.

Do interior vem um cheiro: **terra**, **cinza**, e algo doce demais para ser saudável.
