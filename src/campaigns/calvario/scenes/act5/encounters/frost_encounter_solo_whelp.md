---
id: act5/encounters/frost_encounter_solo_whelp
title: Cria perdida
chapter: 5
ambientTheme: act5
choices:
  - text: "Enfrentar a cria isolada"
    effects:
      - op: startCombat
        encounterId: frost_whelp_solo
        onVictory: act5/frost_hub
        onDefeat: shared/game_over
        onFlee: act5/frost_hub
onEnter: []
---
Uma só **cria** te seguiu pelo eco dos teus passos — curiosidade ou **fome**, o resultado é o mesmo. Olha-te como quem lê **preço** numa vitrine: não há vergonha, só **cálculo** gelado.

Se a deixares ir, ela não te agradece — **aprende** o teu cheiro para a próxima vez.
