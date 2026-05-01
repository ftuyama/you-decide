---
id: act2/hub_catacomb
chapter: 2
type: hub
ambientTheme: explore
artKey: hub
highlight: true
title: Cruzeiro — hub
choices:
  - text: "Voltar ao corredor dos ratos"
    next: act2/rats_choice
    condition: { noFlag: rats_cleared }
    preview: "Ainda há rangido e fedor a ninho."
  - text: "Ir ao mercador fantasma"
    next: act2/merchant/merchant_moon
    condition: { day: { gte: 2 } }
    preview: "Comércio estranho; preço em ouro ou em segredo — raramente aparece no primeiro dia."
  - text: "Farol — voz da Vigília no cruzeiro"
    next: act2/faction/vigilia_envoy
    condition:
      all:
        - { noFlag: act2_faction_envoy_vigilia_done }
        - any:
            - { rep: { faction: vigilia, gte: 2 } }
            - { rep: { faction: vigilia, lte: -2 } }
    preview: "Reputação forte com a ordem — ou inimizade aberta. Uma vez só."
  - text: "Símbolos frescos — eco do Círculo"
    next: act2/faction/circulo_envoy
    condition:
      all:
        - { noFlag: act2_faction_envoy_circulo_done }
        - any:
            - { rep: { faction: circulo, gte: 2 } }
            - { rep: { faction: circulo, lte: -2 } }
    preview: "Círculo de confiança ou cinza hostil. Uma vez só."
  - text: "Carne de sino — rumor do Culto"
    next: act2/faction/culto_envoy
    condition:
      all:
        - { noFlag: act2_faction_envoy_culto_done }
        - any:
            - { rep: { faction: culto, gte: 2 } }
            - { rep: { faction: culto, lte: -2 } }
    preview: "Devoção ou ruptura com o Terceiro Sino. Uma vez só."
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
        - { noFlag: act2_circle_ritual_tribute_done }
    preview: "O Círculo cobra presença; a corrupção anota."
  - text: "Acampamento da Vigília"
    next: act2/camp/vigilia_camp
    preview: "Fogo, reza e um sopro de suprimento."
  - text: "Patrulha do perímetro (explorar mapa)"
    next: shared/explore_nav
    preview: "Move-te pelos túneis — stress sobe; encontros possíveis."
    effects:
      - { op: setExploration, graphId: act2_catacomb, nodeId: cross_start }
      - { op: setAsciiMap, mapId: act2_catacomb }
  - text: "Passagem marcada — eco de juramentos"
    next: act2/lore/lore_crossroads
    condition:
      all:
        - { level: { gte: 7 } }
        - { day: { lte: 6 } }
    preview: "Memória antiga; perícia e sorte pesam — mas o eco some se demorares demasiado."
  - text: "Observar o cruzeiro: marcas no chão"
    next: act2/hub_observe
    preview: "Ler o chão como mapa de quem passou antes."
  - text: "Mexer na cera das velas — moeda presa (uma vez)"
    next: act2/cruzeiro_echo_once
    condition:
      all:
        - { noFlag: act2_echo_done }
        - { day: { gte: 10 } }
    preview: "+1 ouro; sem combate."
  - text: "Escutar um eco que sussurra o dia"
    next: act2/hub_catacomb
    condition:
      all:
        - { level: { gte: 6 } }
        - { day: { lte: 5 } }
    showWhenLocked: true
    lockedHint: "Precisas de nível 6 e de ouvir isto antes do dia 6 — depois o eco cala-se."
    preview: "Voz seca no cruzeiro; registo no diário."
    effects:
      - { op: addDiary, text: "Uma voz presa ao teto: \"Já vais no dia {{day}}.\"" }
  - text: "—"
    next: act2/encounters/random_router
    condition: { flag: __scenegraph_anchor_act2_random_router }
  - text: "Descer mais fundo"
    next: act3/descent
    condition:
      all:
        - { level: { gte: 5 } }
        - { flag: act2_explore_goal_reached }
    showWhenLocked: true
    lockedHint: "Precisas de nível 5 e de encontrar o limiar no mapa do perímetro (exploração a partir do cruzeiro)."
    preview: "Capítulo 3 — a masmorra aperta o silêncio."
    effects:
      - { op: setChapter, chapter: 3 }
      - { op: setNarrativeTier, tier: 3 }
onEnter:
  - { op: addXp, amount: 8 }
---
Velas e **cera** prendem o passo no cruzeiro; *hoje é **dia {{day}}** no subsolo.*

Um **eco** de sino sobe das profundezas e morre antes de chegar à cidade — como se o **silêncio** de lá em baixo **comesse** o som e só deixasse passar o necessário para te lembrar que ainda há ouvidos.
