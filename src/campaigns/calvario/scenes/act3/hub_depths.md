---
id: act3/hub_depths
title: Núcleo das Profundezas
chapter: 3
type: hub
ambientTheme: act3
artKey: depths
highlight: true
choices:
  - text: "Patrulhar as profundezas (explorar mapa)"
    uiSection: "Explorar"
    next: shared/explore_nav_act3
    preview: "Mover-te pelos corredores; stress sobe e encontros podem acontecer."
    effects:
      - { op: setExploration, graphId: act3_depths, nodeId: depths_drowned_gallery }
      - { op: setAsciiMap, mapId: act3_depths }
  - text: "Rumo ao trono de ossos"
    uiSection: "Trono e pedra"
    next: act4/throne/throne_gate
    condition:
      all:
        - { level: { gte: 10 } }
        - { flag: stone_guard_defeated }
        - { flag: act3_explore_goal_reached }
    showWhenLocked: true
    lockedHint: "Precisas de nível 10, de derrotar o guardião de pedra e de alcançar o portão nas profundezas."
    preview: "Capítulo 4 — confronto com Morvayn; o trono espera."
    timedMs: 15000
    fallbackNext: act3/stone_corridor
    effects:
      - { op: setChapter, chapter: 4 }
      - { op: addDiary, text: "O trono chama." }
  - text: "Lado do guardião (opcional)"
    uiSection: "Trono e pedra"
    next: act3/stone_corridor
    condition: { noFlag: stone_guard_defeated }
    preview: "Runas, golem e provas antes do trono."
  - text: "Rever o corredor de pedra (eco do guardião)"
    uiSection: "Trono e pedra"
    next: act3/stone_corridor
    condition: { flag: stone_guard_defeated }
    preview: "O silêncio agora é teu — runas e nicho, sem o golem."
  - text: "Seguir rasto de cinza e corda — mensageiro interrompido"
    uiSection: "Rumores"
    next: act3/messenger_cold_trail
    condition:
      all:
        - { level: { gte: 8 } }
        - { noFlag: act3_messenger_done }
    preview: "Furtividade ou força; Vigília ou Círculo cobram o despacho."
  - text: "Ouvir tubagens sob a pedra"
    uiSection: "Rumores"
    next: act3/pipes_whisper
    condition:
      all:
        - { level: { gte: 7 } }
        - { noFlag: act3_pipes_done }
    preview: "Sorte; sucesso dá pista, falha gasta suprimento."
  - text: "Voltar ao Cruzeiro — hub"
    uiSection: "Regresso"
    next: act2/hub_catacomb
    preview: "Sobe ao cruzeiro; capítulo 2 no mapa da história."
    effects:
      - { op: setChapter, chapter: 2 }
onEnter:
  - { op: addXp, amount: 10 }
  - { op: clearAsciiMap }
---
Profundezas **silenciosas**. Morvayn não está longe — e o silêncio dele já foi **política** antes de ser magia: rede no teto, facção no corredor, cadáver no trono como **factura** pendente. Por baixo dele, **buraco** sem nome no mapa.

Aqui não se **acampa** como no cruzeiro: o subsolo cobra presença contínua — Vigília, Círculo e culto deixam **rasto** no mesmo ar, e o teu fôlego torna-se moeda rara. Se trouxeste **companhia**, o silêncio pesa em voz dupla; se vieste **só**, o eco finge ser resposta.
