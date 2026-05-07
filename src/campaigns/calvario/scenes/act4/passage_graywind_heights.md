---
id: act4/passage_graywind_heights
title: Passagem
chapter: 4
ambientTheme: explore
choices:
  - text: "Parar no limiar — armadura cinzenta que não veio do trono"
    condition:
      all:
        - { noFlag: kaelsworn_recruited }
        - { noFlag: kr_won_act4 }
    preview: "Encontro especial: Kael, o Rastreador Cinzento."
    effects:
      - op: startCombat
        encounterId: kael_rival_act4
        onVictory: shared/kaelsworn_post_act4
        onFlee: act4/passage_graywind_heights
        onDefeat: shared/game_over
  - text: "Partir rumo às Cimeiras do Vento Cinzento — seguir o rumor do gelo"
    next: act5/frost_opening
    preview: "Capítulo 5. Longe do trono, o frio ainda pergunta quem manda no silêncio."
onEnter:
  - { op: registerEnding, endingId: passage_graywind_heights }
  - { op: addXp, amount: 16 }
---
## Passagem

{{throneOutcomeLine}}

{{factionThroneEcho}}

**Encontras** o que o trono **escondeu**: não um **fim** — um **alcance** mais **fundo**, uma **dobra** no eixo onde a pedra **aprende** um **frio** **novo**. O trono **não** fechou o **eixo**: nas **Cimeiras**, a ferida **abre** um **bolso** de gelo tão vasto que **parece** montanha — uma **câmara** com neve por **teto**. **Dívida** com **juro** em **vento**.
