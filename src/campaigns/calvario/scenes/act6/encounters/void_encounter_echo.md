---
id: act6/encounters/void_encounter_echo
title: Murmúrios sem plateia
chapter: 6
ambientTheme: void
choices:
  - text: "Aturar o hospedeiro até calar uma boca de cada vez"
    effects:
      - op: startCombat
        encounterId: act6_wild_murmur_solo
        onVictory: shared/explore_nav_act6
        onDefeat: shared/game_over
        onFlee: shared/explore_nav_act6
onEnter: []
---
O ar **espessa** com vozes que não têm dono — lembram-te de nomes **errados** e datas **certas**, e riem quando corrigis.

Não é música. É **memória** a fazer greve.
