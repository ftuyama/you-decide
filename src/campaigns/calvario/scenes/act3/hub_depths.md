---
id: act3/hub_depths
title: Núcleo das Profundezas
chapter: 3
type: hub
ambientTheme: act3
artKey: depths
highlight: true
choices:
  - text: "Rumo ao trono de ossos"
    next: act4/throne/throne_gate
    condition:
      all:
        - { level: { gte: 10 } }
        - { flag: stone_guard_defeated }
    showWhenLocked: true
    lockedHint: "Precisas de nível 10 e de já teres posto abaixo o guardião de pedra — só então o trono deixa de ser rumor."
    preview: "Capítulo 4 — confronto com Morvayn; o trono espera."
    timedMs: 15000
    fallbackNext: act3/stone_corridor
    effects:
      - { op: setChapter, chapter: 4 }
      - { op: addDiary, text: "O trono chama." }
  - text: "Lado do guardião (opcional)"
    next: act3/stone_corridor
    condition: { noFlag: stone_guard_defeated }
    preview: "Runas, golem e provas antes do trono."
  - text: "Rever o corredor de pedra (eco do guardião)"
    next: act3/stone_corridor
    condition: { flag: stone_guard_defeated }
    preview: "O silêncio agora é teu — runas e nicho, sem o golem."
  - text: "Seguir rasto de cinza e corda — mensageiro interrompido"
    next: act3/messenger_cold_trail
    condition:
      all:
        - { level: { gte: 8 } }
        - { noFlag: act3_messenger_done }
    preview: "Furtividade ou força; Vigília ou Círculo cobram o despacho."
  - text: "Ouvir tubagens sob a pedra"
    next: act3/pipes_whisper
    condition:
      all:
        - { level: { gte: 7 } }
        - { noFlag: act3_pipes_done }
    preview: "Sorte; sucesso dá pista, falha gasta suprimento."
  - text: "Voltar ao Cruzeiro — hub"
    next: act2/hub_catacomb
    preview: "Sobe ao cruzeiro; capítulo 2 no mapa da história."
    effects:
      - { op: setChapter, chapter: 2 }
onEnter:
  - { op: clearAsciiMap }
---
Profundezas **silenciosas**. Morvayn não está longe — e o silêncio dele já foi **política** antes de ser magia: rede no teto, facção no corredor, cadáver no trono como **factura** pendente. Por baixo dele, **buraco** sem nome no mapa.
