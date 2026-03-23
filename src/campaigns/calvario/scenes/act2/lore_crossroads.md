---
id: act2/lore_crossroads
chapter: 2
title: Eco de juramentos
choices:
  - text: "Aceitar o nome de Cavaleiro caído (cavaleiro)"
    next: act2/trial_fallen_angel_gate
    condition: { class: knight }
    preview: "Provação · anjo caído; título só se venceres"
  - text: "Aceitar o título de Mago das trevas (arcanista)"
    next: act2/trial_fallen_angel_gate
    condition: { class: mage }
    preview: "Provação · anjo caído; título só se venceres"
  - text: "Voltar-se ao Clérigo penitente"
    next: act2/path_cleric_penitent
    condition: { class: cleric }
    preview: Arquétipo narrativo
  - text: "Mergulhar o braço no lodo que sussurra"
    next: act2/luck_mire
    preview: Sorte — 2d6 + SOR
  - text: "Recordar o cavaleiro caído (eco do path)"
    next: act2/hub_catacomb
    condition: { path: fallen }
    effects:
      - { op: addDiary, text: "O cruzeiro lembrou-me o nome que aceitei: caído, mas ainda de pé." }
  - text: "Recordar o arcano sombrio (eco do path)"
    next: act2/hub_catacomb
    condition: { path: dark }
    effects:
      - { op: addDiary, text: "Sombras não pedem permissão — eu dei mesma assim." }
  - text: "Recordar o penitente (eco do path)"
    next: act2/hub_catacomb
    condition: { path: penitent }
    effects:
      - { op: addDiary, text: "Cada pedra aqui confessa melhor do que eu." }
  - text: "Regressar ao cruzeiro"
    next: act2/hub_catacomb
onEnter: []
---
Uma **voz** sem dono pergunta o que foste e o que aceitas ser. O ar **pesa** como manto molhado; as pedras **lembram** juramentos que outros quebraram antes de ti.

Não há mapa para isto — só **decisões** que o jogo regista na carne.
