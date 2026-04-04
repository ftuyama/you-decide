---
id: act6/fractured_void_router
title: Colunas que não perguntam
chapter: 6
ambientTheme: void
randomBranch:
  id: act6_fractured_void_rb
  branches:
    - { weight: 1, next: act6/void_encounter_fragment_solo }
    - { weight: 1, next: act6/void_encounter_pair_fragments }
    - { weight: 1, next: act6/void_encounter_veil }
    - { weight: 1, next: act6/void_encounter_echo }
    - { weight: 1, next: act6/void_encounter_penitent }
    - { weight: 0.35, next: act6/void_encounter_veil_fragment }
    - { weight: 0.35, next: act6/void_encounter_echo_fragment }
    - { weight: 0.2, next: act6/void_encounter_triple_fragments }
    - { weight: 0.08, next: act6/void_encounter_shadow_rare }
    - { weight: 0.6, next: act6/void_encounter_corruption_horde, condition: { resource: { corruption: { gte: 4 } } } }
    - { weight: 1, next: act6/hub_fractured_nave }
choices: []
onEnter: []
---
Fechas os olhos um instante — a **nave** não precisa de ti para continuar a fingir que é um templo. Algo **move-se** entre os espelhos partidos: às vezes é só **ruído**; outras, é **forma** a pedir nome.

Quando abres de novo, o corredor já **decidiu** o que és desta vez — visita, presa ou **eco** ambulante.
