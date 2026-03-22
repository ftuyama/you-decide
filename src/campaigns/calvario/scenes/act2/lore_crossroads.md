---
id: act2/lore_crossroads
chapter: 2
title: Eco de juramentos
choices:
  - text: "Aceitar o nome de Cavaleiro caído (cavaleiro)"
    next: act2/path_knight_fallen
    condition: { class: knight }
    preview: Arquétipo narrativo
  - text: "Aceitar o título de Mago das trevas (arcanista)"
    next: act2/path_mage_dark
    condition: { class: mage }
    preview: Arquétipo narrativo
  - text: "Voltar-se ao Clérigo penitente"
    next: act2/path_cleric_penitent
    condition: { class: cleric }
    preview: Arquétipo narrativo
  - text: "Mergulhar o braço no lodo que sussurra"
    next: act2/luck_mire
    preview: Sorte — 2d6 + SOR
  - text: "Regressar ao cruzeiro"
    next: act2/hub_catacomb
onEnter: []
---
Uma **voz** sem dono pergunta o que foste e o que aceitas ser. O ar **pesa** como manto molhado; as pedras **lembram** juramentos que outros quebraram antes de ti.

Não há mapa para isto — só **decisões** que o jogo regista na carne.
