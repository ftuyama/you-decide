---
id: act4/throne/throne_gate
chapter: 4
ambientTheme: explore
artKey: throne
highlight: true
title: Ante-sala do trono
choices:
  - text: "Ouvir o necromante antes de cruzar ferro"
    uiSection: "Confronto"
    next: act4/morvayn_parley
    preview: "Palavras antes do aço; pacto ou provocação."
  - text: "Atacar de imediato (sem palavras)"
    uiSection: "Confronto"
    next: act4/encounters/fight_morvayn
    preview: "Ferro já — ou hesitação que vira conversa."
  - text: "Observar o trono: ossos, runas, correntes"
    uiSection: "Olhos postos"
    next: act4/throne/throne_observe
    condition: { noFlag: throne_acted_observe }
    preview: "Informação e risco de ser visto demais."
  - text: "Negociar com o mercador à sombra das correntes"
    uiSection: "Troca"
    next: act4/late_merchant
    preview: "Ouro, itens e silêncio em frascos."
  - text: "Inspeção arcana — ler runas sem ceder ao trono"
    uiSection: "Provas no salão"
    next: act4/throne/throne_arcane
    condition: { noFlag: throne_acted_arcane }
    preview: "Mente contra runa; falha pode custar."
  - text: "Prova de nervos — o chão que mente"
    uiSection: "Provas no salão"
    next: act4/throne/throne_nerves
    condition: { noFlag: throne_acted_nerves }
    preview: "Sorte e perna firme; o chão engana."
  - text: "Sondar correntes e gotejar"
    uiSection: "Provas no salão"
    next: act4/throne/throne_chains
    condition: { noFlag: throne_acted_chains }
    preview: "Correntes e líquido suspeito; ouro ou maldição."
  - text: "Ofício no salão: bênção, postura ou fórmula"
    uiSection: "Provas no salão"
    next: act4/throne/throne_class_blessing
    condition: { noFlag: throne_acted_class_blessing }
    preview: "A tua classe abre um caminho ritual."
---
O **Trono de Ossos** sobe em costelas entrelaçadas; **correntes** rangem sem vento.

**Morvayn** antecede a cadeira — **sombra**, depois sorriso **sem lábios** certos. O pulso verde **bate** com o teu coração; o salão devolve **sussurros** alheios que sabem o teu nome.

Cada **ensaio** no salão **gasta-se** no osso: ainda dá para **negociar** ao mercador ou deixar o aço **esperar**.
