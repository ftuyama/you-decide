---
id: act5/frost_epilogue
title: Epílogo de Geada
chapter: 5
choices:
  - text: "Guardar este fim nas montanhas e encerrar o diário"
    next: act4/epilogue_close
onEnter:
  - { op: grantItem, itemId: frost_wyrm_scale }
  - { op: addMark, mark: vetrnax_slain }
  - { op: addDiary, text: "Vetrnax caiu. O gelo partiu-se como vidro — e por baixo, por um instante, ouvi o Terceiro Sino a aprender um nome novo." }
---
**Vetrnax** desfaz-se em **cascata** de cristais. O vento, que antes mordia, agora só **sussurra** — como quem repete uma ordem sem acreditar.

Na tua mão, uma **escama** tão fria que queima: troféu, relíquia, **prova** de que o culto não é o único som no mundo.

O rumor das Cimeiras vai mudar. Alguns dirão que o dragão morreu; outros, que **dorme** num eco mais profundo.

Tu sabes a verdade **húmida** do pacto: cada vitória é outra **corda** — e o Sino adora quem puxa sem se queixar.
