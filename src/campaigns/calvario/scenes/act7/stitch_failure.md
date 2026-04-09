---
id: act7/stitch_failure
title: Fio partido
chapter: 7
ambientTheme: ash_sky
artKey: stitch_torn
choices:
  - text: "Cuspir o sabor de metal e seguir de joelhos se for preciso"
    next: act7/wasteland_antechamber
onEnter:
  - { op: addMark, mark: act7_sky_stitch_torn }
  - { op: addResource, resource: faith, delta: -1 }
  - { op: addResource, resource: corruption, delta: 1 }
  - { op: addDiary, text: "O padrão escapou-me. O céu riu sem som e eu fiquei com a boca cheia de cinza — fé não é garantia; é aposta." }
---
O diagrama **rasga-se** e o mundo devolve **ruído** puro: não é derrota limpa — é **entrada** de outra língua na tua cabeça, uma que não pede tradução, só **obediência**.

Algo em ti **cede** com o som certo: menos **confiança** no alto, mais **sedução** pelo que morde de volta.
