---
id: act4/throne/throne_gate
chapter: 4
ambientTheme: explore
artKey: throne
highlight: true
title: Ante-sala do trono
choices:
  - text: "Ouvir o necromante antes de cruzar ferro"
    next: act4/morvayn_parley
    preview: "Palavras antes do aço; pacto ou provocação."
  - text: "Atacar de imediato (sem palavras)"
    next: act4/encounters/fight_morvayn
    preview: "Ferro já — ou hesitação que vira conversa."
    timedMs: 10000
    fallbackNext: act4/morvayn_parley
  - text: "Observar o trono: ossos, runas, correntes"
    next: act4/throne/throne_observe
    condition: { noFlag: throne_acted_observe }
    preview: "Informação e risco de ser visto demais."
  - text: "Negociar com o mercador à sombra das correntes"
    next: act4/late_merchant
    preview: "Ouro, itens e silêncio em frascos."
  - text: "Inspeção arcana — ler runas sem ceder ao trono"
    next: act4/throne/throne_arcane
    condition: { noFlag: throne_acted_arcane }
    preview: "Mente contra runa; falha pode custar."
  - text: "Prova de nervos — o chão que mente"
    next: act4/throne/throne_nerves
    condition: { noFlag: throne_acted_nerves }
    preview: "Sorte e perna firme; o chão engana."
  - text: "Sondar correntes e gotejar"
    next: act4/throne/throne_chains
    condition: { noFlag: throne_acted_chains }
    preview: "Correntes e líquido suspeito; ouro ou maldição."
  - text: "Ofício no salão: bênção, postura ou fórmula"
    next: act4/throne/throne_class_blessing
    condition: { noFlag: throne_acted_class_blessing }
    preview: "A tua classe abre um caminho ritual."
onEnter:
  - { op: setNarrativeTier, tier: 4 }
---
O **Trono de Ossos** ergue-se como onda fossilizada — costelas de gigantes entrelaçadas, **correntes** vivas que range sem vento.

**Morvayn** está sentado antes de existir cadeira: primeiro a **sombra**, depois a forma. Sorri **sem lábios** — ou com lábios de outra pessoa.

O pulso verde **bate** ao ritmo do teu coração, como um **médico** que não cura. O salão **inventa** ecos: cada passo te devolve um **sussurro** que não é teu — e mesmo assim conhece o teu nome.

Cada **ensaio** no salão — olhar, ler, pisar, tocar, oficiar — **gasta-se** como fricção: o osso **lembra** e não repete o mesmo convite. Ainda há tempo para **negociar** com quem vende silêncio em frascos, ou o aço **espera** — frio como estatística.
