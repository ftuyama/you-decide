---
id: act4/throne_class_blessing
title: Ofício no salão
chapter: 4
ambientTheme: explore
choices:
  - text: "Traçar um sinal breve no ar — bênção contida"
    next: act4/throne_gate
    condition: { class: cleric }
    effects:
      - { op: addRep, faction: vigilia, delta: 1 }
      - { op: addDiary, text: "O trono não aceita luz — mas aceita que eu a nomeie sem a oferecer de graça." }
  - text: "Medir o espaço com o corpo — postura de muralha"
    next: act4/throne_gate
    condition: { class: knight }
    effects:
      - { op: grantTemporaryBuff, attr: str, delta: 1, remainingScenes: 3 }
      - { op: addDiary, text: "O chão pediu peso; dei-lhe disciplina, não teatro." }
  - text: "Contar o eco como fórmula incompleta"
    next: act4/throne_gate
    condition: { class: mage }
    effects:
      - { op: grantTemporaryBuff, attr: mind, delta: 1, remainingScenes: 3 }
      - { op: addDiary, text: "Cada silêncio tem coeficiente — eu só anotei o que não me come primeiro." }
  - text: "Voltar sem invocar ofício"
    next: act4/throne_gate
onEnter: []
---
O salão **reconhece** ofícios como quem reconhece **ferramentas**: não julga — **mede** o que podes estragar com elas.
