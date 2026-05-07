---
id: act3/lore/cult_negotiate
title: Pacto sem altar
chapter: 3
ambientTheme: act3
artKey: cult_negotiate
highlight: true
choices:
  - text: "Mostrar o sinete do Terceiro Sino — pedir favor à margem do contrato"
    uiSection: "Pacto"
    next: act3/hub_depths
    condition:
      all:
        - { rep: { faction: culto, gte: 5 } }
        - { noFlag: act3_negotiate_done }
        - { noFlag: act3_negotiate_culto_favor }
    preview: "Ouro e experiência · reconhecimento do culto (uma vez)."
    effects:
      - { op: setFlag, key: act3_negotiate_culto_favor, value: true }
      - { op: addResource, resource: gold, delta: 8 }
      - { op: addXp, amount: 22 }
      - { op: addDiary, text: "O encarregado inclinou a cabeça como quem confirma saldo: o Sino lembra quem paga duas vezes." }
  - text: "Aceitar a oferta: dor por sussurro"
    uiSection: "Pacto"
    next: act3/hub_depths
    condition: { noFlag: act3_negotiate_done }
    preview: "Círculo +1, Vigília −1; ouro adiantado."
    effects:
      - { op: setFlag, key: act3_negotiate_done, value: true }
      - { op: addRep, faction: circulo, delta: 1 }
      - { op: addRep, faction: vigilia, delta: -1 }
      - { op: addResource, resource: gold, delta: 2 }
      - { op: addDiary, text: "Aceitei moeda que não posso devolver — e um nome que vou ouvir nos canos quando descer mais fundo." }
  - text: "[+] Recusar com a postura do penitente — devolver a moeda intacta"
    uiSection: "Pacto"
    next: act3/hub_depths
    condition:
      all:
        - { class: cleric }
        - { noFlag: act3_negotiate_done }
    preview: "Vigília +1, fé +1; ele recua, mas registra o teu rosto."
    effects:
      - { op: setFlag, key: act3_negotiate_done, value: true }
      - { op: addRep, faction: vigilia, delta: 1 }
      - { op: addResource, resource: faith, delta: 1 }
      - { op: addDiary, text: "Recusei sem teatro; o cultista guardou a moeda como quem guarda dívida — eu também." }
  - text: "Recusar — a Vigília reconhece o teu silêncio"
    uiSection: "Pacto"
    next: act3/hub_depths
    condition:
      all:
        - { rep: { faction: vigilia, gte: 1 } }
        - { noFlag: act3_negotiate_done }
        - not: { class: cleric }
    preview: "Vigília +1; o cultista ri seco e some."
    effects:
      - { op: setFlag, key: act3_negotiate_done, value: true }
      - { op: addRep, faction: vigilia, delta: 1 }
      - { op: addDiary, text: "Não disse 'não' — disse o nome de quem mandou. Bastou para o silêncio dele." }
  - text: "[!] Atacar — ferro antes de palavra"
    uiSection: "Pacto"
    condition: { noFlag: act3_negotiate_done }
    effects:
      - op: setFlag
        key: act3_negotiate_done
        value: true
      - op: startCombat
        encounterId: cultist_patrol
        onVictory: act3/hub_depths
        onDefeat: shared/game_over
        onFlee: act3/hub_depths
    preview: "Combate imediato; sem barganha."
  - text: "Lembrar a oferta recusada (já decidiste)"
    uiSection: "Pacto"
    next: act3/hub_depths
    condition: { flag: act3_negotiate_done }
    preview: "O cultista desapareceu nas tubagens; o eco do gesto continua."
onEnter: []
---
**Voz baixa**, fala curta: *"Trago contrato simples — vocês descem, nós escrevemos o nome certo nos canos. Em troca, **silêncio** fora do túnel quando saírem."*

O **cultista** segura uma moeda velha entre dois dedos, sem afetação. Não é fanático: é **encarregado**. Atrás dele, a sombra de dois outros — não para te ameaçar, para **registrar** a tua resposta.

A oferta não tem altar nem incenso. Tem **pragmatismo**: o Círculo paga para que a Vigília não saiba o que vais ver lá em baixo. **Tu decides** se isso é negócio.
