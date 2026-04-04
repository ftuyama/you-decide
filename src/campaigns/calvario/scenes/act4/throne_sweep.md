---
id: act4/throne_sweep
title: Última varredura
chapter: 4
ambientTheme: explore
artKey: throne_sweep
choices:
  - text: "Seguir uma fissura atrás do trono (explorar em silêncio)"
    condition: { noItem: morvayn_heart_shard }
    next: act4/throne_sweep_hidden_treasure
  - text: "Catalogar ossos e sombras (teste de Mente)"
    next: act4/throne_sweep_catalog
  - text: "Soltar uma sílaba proibida ao vácuo (sorte)"
    next: act4/throne_sweep_word
  - text: "Não dar mais tempo ao osso — à segunda fase"
    next: act4/encounters/fight_morvayn_2
onEnter: []
---
Antes que o trono **feche** a conta, podes tratar o salão como **mesa** — medições, apostas, **erros** honestos.
