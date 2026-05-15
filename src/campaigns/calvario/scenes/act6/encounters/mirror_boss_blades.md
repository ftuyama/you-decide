---
id: act6/encounters/mirror_boss_blades
title: O Outro Nome — ferro
chapter: 6
ambientTheme: void
artKey: act6_mirror_final
highlight: true
artHighlightSfx: mysterious
choices:
  - text: "Lutar contra o meu reflexo soberano"
    effects:
      - op: startCombat
        encounterId: act6_shadow_self
        onVictory: act6/encounters/mirror_boss_resolve
        onDefeat: shared/game_over
        onFlee: act6/hub_fractured_nave
onEnter: []
---
[RASCUNHO] O **espelho** **fecha** a **negociação**. Sobra **sombra** com **dente** — e **tu** com **lâmina**.
