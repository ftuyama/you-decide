---
id: act5/frost_tomas/rescued
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
A corda cai; **Tomás** rouba ar ao céu e agarra o escudo como **nome**.

> *"Não vim por ti — vim pelo que deixas para trás. Ordena levantar, levanto; senão, caminho contigo."*

**Contrato** de ferro e silêncio, não romance.
