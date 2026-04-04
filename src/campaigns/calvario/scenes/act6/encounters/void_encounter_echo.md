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
        onVictory: act6/hub_fractured_nave
        onDefeat: act4/game_over
        onFlee: act6/hub_fractured_nave
onEnter: []
---
O ar **espessa** com vozes que não têm dono — lembram-te de nomes **errados** e datas **certas**, e riem quando corrigis.

Não é música. É **memória** a fazer greve.
