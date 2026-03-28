---
id: act5/frost_tomas_rescued
title: O Escudo Levanta
chapter: 5
ambientTheme: act5
artKey: frost_peaks
choices:
  - text: "Voltar ao desfiladeiro"
    next: act5/frost_hub
onEnter:
  - { op: setFlag, key: tomas_rescued, value: true }
  - { op: recruit, companionId: squire_tomas }
  - { op: addDiary, text: "Arranquei Tomás da corda e do ritual. O escudo dele ainda treme — mas jurou-se a seguir quem não fugir de primeiro." }
---
A corda cai como serpente morta. Tomás respira como quem rouba o ar ao céu; as mãos tremem, mas agarra o escudo como nome próprio.

> "Não vim para ti — vim para o que deixas para trás." Engole orgulho. "Se me ordenares levantar, levanto. Se não — caminho ao teu lado até o calvário ter vergonha de nós."

Não é romance — é contrato entre ferro e silêncio.