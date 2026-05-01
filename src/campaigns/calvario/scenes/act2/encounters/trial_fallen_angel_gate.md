---
id: act2/encounters/trial_fallen_angel_gate
chapter: 2
ambientTheme: act2
title: Provação do véu
choices:
  - text: "Enfrentar o anjo com o aço (cavaleiro)"
    condition: { class: knight }
    effects:
      - op: startCombat
        encounterId: boss_fallen_angel_trial
        onVictory: act2/path_knight_fallen
        onDefeat: act2/lore/lore_crossroads
        onFlee: act2/lore/lore_crossroads
    preview: "Combate · vantagem do inimigo"
  - text: "Enfrentar o anjo com o arcano (mago)"
    condition: { class: mage }
    effects:
      - op: startCombat
        encounterId: boss_fallen_angel_trial
        onVictory: act2/path_mage_dark
        onDefeat: act2/lore/lore_crossroads
        onFlee: act2/lore/lore_crossroads
    preview: "Combate · vantagem do inimigo"
  - text: "Enfrentar o anjo com a fé (clérigo)"
    condition:
      all:
        - { class: cleric }
        - not:
            path: penitent
    effects:
      - op: startCombat
        encounterId: boss_fallen_angel_trial
        onVictory: act2/path_cleric_penitent
        onDefeat: act2/lore/lore_crossroads
        onFlee: act2/lore/lore_crossroads
    preview: "Combate · vantagem do inimigo"
onEnter: []
---
Do **cinza** ergue-se **silhueta** que já foi luz demais para um corpo — não pede perdão, pede **prova**.

*Quem quiser nome de queda, treva ou penitência que vença o que caiu e ainda corta* — sem **atalho**: ferro, arcano ou oração, ou **volta** sem título.
