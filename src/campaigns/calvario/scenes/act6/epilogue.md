---
id: act6/epilogue
title: Epílogo do Espelho Quebrado
chapter: 6
ambientTheme: void
artKey: act6_epilogue_crossing
highlight: true
choices:
  - text: "Levantar os olhos — o céu já não pede desculpa"
    next: act7/opening_terminal_glow
  - text: "Fechar o diário por agora"
    next: endings/epilogue_depths
onEnter:
  - { op: registerEnding, endingId: epilogue_mirror }
  - { op: addResource, resource: faith, delta: 1 }
---
Levas a nave fraturada nos olhos — **caco** de espelho que mentiu no primeiro degrau, agora **corte** na palma. Para quem olha depressa, o mundo acima é o mesmo.

Para ti, ruas viram hipóteses; o **pulso verde** não mudou de tom — mudaste tu a forma de o **contar**. Um passo, não por pureza: por **escolha**.

