---
id: act2/hub_catacomb
chapter: 2
type: hub
ambientTheme: explore
artKey: hub
title: Cruzeiro — hub
choices:
  - text: "Voltar ao corredor dos ratos"
    next: act2/rats_choice
    condition: { noFlag: rats_cleared }
  - text: "Ir ao mercador fantasma"
    next: act2/merchant_moon
  - text: "Ouvir proposta de Mira"
    next: act2/recruit_offer
    condition: { noFlag: mira_recruited }
  - text: "Ritual do Círculo (evento)"
    next: act2/circle_ritual
  - text: "Acampamento da Vigília"
    next: act2/vigilia_camp
  - text: "Rota aleatória (demo)"
    next: act2/random_router
  - text: "Passagem marcada — eco de juramentos"
    next: act2/lore_crossroads
  - text: "Observar o cruzeiro: marcas no chão"
    next: act2/hub_observe
  - text: "Descer mais fundo"
    next: act3/descent
    effects:
      - { op: setChapter, chapter: 3 }
      - { op: setNarrativeTier, tier: 3 }
onEnter: []
---
O cruzeiro **segura** o peso de quem passa. Velas novas e velhas misturam-se; **cera** cola botas ao chão.

Toda escolha **paga** algo — às vezes suprimento, às vezes **só um bocado de alma**.
