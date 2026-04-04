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
    preview: "Ainda há rangido e fedor a ninho."
  - text: "Ir ao mercador fantasma"
    next: act2/merchant/merchant_moon
    preview: "Comércio estranho; preço em ouro ou em segredo."
  - text: "Ouvir proposta de Mira"
    next: act2/recruit_offer
    condition: { noFlag: mira_recruited }
    preview: "Uma voz na sombra oferece companhia."
  - text: "Ritual do Círculo (evento)"
    next: act2/circle_ritual/circle_ritual
    condition:
      all:
        - { level: { gte: 4 } }
        - { dayMod: { mod: 5, eq: 0 } }
    preview: "O Círculo cobra presença; a corrupção anota."
  - text: "Acampamento da Vigília"
    next: act2/camp/vigilia_camp
    preview: "Fogo, reza e um sopro de suprimento."
  - text: "Rota aleatória (demo)"
    next: act2/encounters/random_router
    preview: "O túnel exige decisão rápida — ou recuas para o acampamento."
    timedMs: 14000
    fallbackNext: act2/camp/vigilia_camp
  - text: "Passagem marcada — eco de juramentos"
    next: act2/lore/lore_crossroads
    condition: { level: { gte: 7 } }
    preview: "Memória antiga; perícia e sorte pesam."
  - text: "Observar o cruzeiro: marcas no chão"
    next: act2/hub_observe
    preview: "Ler o chão como mapa de quem passou antes."
  - text: "Escutar um eco que sussurra o dia"
    next: act2/hub_catacomb
    condition: { day: { gte: 6 } }
    preview: "Voz seca no cruzeiro; registo no diário."
    effects:
      - { op: addDiary, text: "Uma voz presa ao teto: \"Já vais no dia {{day}}.\"" }
  - text: "Descer mais fundo"
    next: act3/descent
    condition: { level: { gte: 5 } }
    preview: "Capítulo 3 — o Calvário aperta o tom."
    effects:
      - { op: setChapter, chapter: 3 }
      - { op: setNarrativeTier, tier: 3 }
onEnter: []
---
O cruzeiro **segura** o peso de quem passa. Velas novas e velhas misturam-se; **cera** cola botas ao chão.

*Quem conta o tempo conta **dia {{day}}** — o subsolo come folhas de calendário.*

Toda escolha **paga** algo — às vezes suprimento, às vezes **só um bocado de alma**.
