---
id: act2/trial_fallen_angel_gate
chapter: 2
title: Provação do véu
choices:
  - text: "Enfrentar o anjo com o aço (cavaleiro)"
    condition: { class: knight }
    effects:
      - op: startCombat
        encounterId: boss_fallen_angel_trial
        onVictory: act2/path_knight_fallen
        onDefeat: act2/lore_crossroads
        onFlee: act2/lore_crossroads
    preview: "Combate · vantagem do inimigo"
  - text: "Enfrentar o anjo com o arcano (mago)"
    condition: { class: mage }
    effects:
      - op: startCombat
        encounterId: boss_fallen_angel_trial
        onVictory: act2/path_mage_dark
        onDefeat: act2/lore_crossroads
        onFlee: act2/lore_crossroads
    preview: "Combate · vantagem do inimigo"
onEnter: []
---
Do **cinza** do cruzeiro ergue-se uma **silhueta** que já foi luz demais para um só corpo. Não pede **perdão** — pede **prova**.

"Quem quiser **nome** de queda ou de **treva**", diz sem boca, "que **vença** o que caiu antes e ainda **corta**."

Não há **atalho**: ou o **ferro** e o **arcano** aguentam o véu, ou **volta** sem título.
