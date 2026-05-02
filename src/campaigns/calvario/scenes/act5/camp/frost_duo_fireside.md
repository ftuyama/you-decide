---
id: act5/camp/frost_duo_fireside
title: Duas lâminas, um fogo
chapter: 5
ambientTheme: camp
artKey: frost_camp
choices:
  - text: "Interromper antes que o gelo entre na conversa"
    next: act5/camp/frost_companion_chat
    effects:
      - { op: adjustCompanionFriendship, companionId: rogue_mira, delta: -4, onceFlag: ff_cf_act5_frost_duo_interrupt_mira }
      - { op: adjustCompanionFriendship, companionId: squire_tomas, delta: -4, onceFlag: ff_cf_act5_frost_duo_interrupt_tomas }
onEnter: []
---
**Mira** e **Tomás** **medem** palavras no fogo — ela quer **nome** ao sair; ele endireita o escudo: *ordem é **sítio** onde ninguém cai sozinho.*

Tu não és árbitro — **testemunha**.

---

{{companionLine}}
