---
id: act2/vigilia_camp
chapter: 2
choices:
  - text: "Descansar no acampamento (−1 suprimento)"
    next: act2/hub_catacomb
    condition: { resource: { supply: { gte: 1 } } }
    effects:
      - { op: campRest }
  - text: "Continuar"
    next: act2/hub_catacomb
onEnter:
  - { op: addRep, faction: vigilia, delta: 1 }
---
Soldados da **Vigília** partilham pão seco. Honra tem gosto de cinza.

**Suprimento** aqui serve para **descansar**: recuperas o teu HP e alivias 1 de stress (custa 1 suprimento).
