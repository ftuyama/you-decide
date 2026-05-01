---
id: act5/encounters/frost_encounter_whelps
title: Crias na nevasca
chapter: 5
ambientTheme: act5
choices:
  - text: "Afastar as crias de geada"
    effects:
      - op: startCombat
        encounterId: frost_whelps
        onVictory: shared/explore_nav_act5
        onDefeat: shared/game_over
        onFlee: shared/explore_nav_act5
onEnter: []
---
Do **branco** saltam duas silhuetas famintas — não é a emboscada da missão; é a montanha a **cobrar** visita. Os dentes **tilintam** como vidro; o hálito cheira a **tempestade** adiada.

Se venceres, aprendes uma regra rústica: na cordilheira, **fome** é mais fiel que mapa.
