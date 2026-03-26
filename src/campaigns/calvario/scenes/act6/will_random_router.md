---
id: act6/will_random_router
title: Balança sem Centro
chapter: 6
ambientTheme: void
randomBranch:
  id: act6_will_rng
  branches:
    - { weight: 1, next: act6/will_trial_duel }
    - { weight: 0.6, next: act6/will_trial_horde, condition: { resource: { corruption: { gte: 3 } } } }
choices: []
onEnter: []
---

