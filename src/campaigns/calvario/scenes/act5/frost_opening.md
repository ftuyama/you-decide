---
id: act5/frost_opening
chapter: 5
artKey: frost_peaks
choices:
  - text: "Subir o desfiladeiro gelado"
    next: act5/frost_ridgeline
onEnter:
  - { op: setChapter, chapter: 5 }
  - { op: addResource, resource: supply, delta: -1 }
  - { op: addDiary, text: "Ordem do culto: nas Cimeiras há um dragão que não pede permissão ao Sino. Devo trazer-lhe o silêncio — ou o contrário." }
---
## Cimeiras do Vento Cinzento

O mapa que te deram não é de estradas — é de **sombras** sobre neve. Cada marco é um aviso: *aqui o vento corta quem fala alto*.

Ainda assim, o **Terceiro Sino** ressoa na tua tempestade interior, mais alto que o vendaval. Serve-te de **bússola** ou de **âncora** — não há terceira coisa.

O rumor fala de **Vetrnax**: não uma fera qualquer, mas um **fio** de geada tão antigo quanto a primeira noite em que o mundo aprendeu a ter medo do céu.
