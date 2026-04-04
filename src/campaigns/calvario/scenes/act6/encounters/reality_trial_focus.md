---
id: act6/encounters/reality_trial_focus
title: Fenda Coerente
chapter: 6
ambientTheme: void
artKey: fractured_nave
choices:
  - text: "Enfrentar o Arauto com a mente fixa"
    effects:
      - { op: startCombat, encounterId: act6_veil_herald, onVictory: act6/reality_after, onDefeat: act4/game_over, onFlee: act6/hub_fractured_nave }
onEnter:
  - { op: addDiary, text: "Segurei o mundo por um fio de pensamento. Descobri que pensamento tambem corta." }
---
Consegues sustentar uma unica versao da sala por alguns segundos. O suficiente para distinguir pedra de reflexo e medo de aviso.

O Arauto sorri sem boca.

