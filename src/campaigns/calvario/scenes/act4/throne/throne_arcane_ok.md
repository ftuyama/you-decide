---
id: act4/throne/throne_arcane_ok
title: Padrão contido
chapter: 4
ambientTheme: explore
choices:
  - text: "Guardar o mapa mental e voltar à ante-sala"
    next: act4/throne/throne_gate
    effects:
      - { op: grantTemporaryBuff, attr: mind, delta: 1, remainingScenes: 3 }
      - { op: addDiary, text: "Vi o compasso do trono — não o suficiente para domá-lo, o suficiente para não me perder logo." }
onEnter:
  - { op: addXp, amount: 12 }
---
Por um instante, o símbolo **encaixa**: não é poder — é **gramática**. O trono deixa de ser só medo e torna-se **frase** que podes recusar em voz alta.
