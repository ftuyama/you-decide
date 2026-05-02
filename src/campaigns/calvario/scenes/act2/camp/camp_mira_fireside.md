---
id: act2/camp/camp_mira_fireside
title: Brasas — palavra com Mira
chapter: 2
ambientTheme: camp
artKey: vigilia_camp
choices:
  - text: "Perguntar o que ela já não rouba ao escuro"
    next: act2/camp/camp_mira_topic_shadows
    effects:
      - { op: addMark, mark: mira_camp_shadows }
      - { op: adjustCompanionFriendship, companionId: rogue_mira, delta: 2, onceFlag: ff_cf_act2_camp_mira_fireside_shadows }
  - text: "Falar da Vigília como quem fala baixo"
    next: act2/camp/camp_mira_topic_vigilia
  - text: "Partilhar silêncio — só o estalar da lenha"
    next: act2/camp/camp_mira_topic_silence
  - text: "Voltar à roda da fogueira"
    next: act2/camp/camp_companion_chat
    effects:
      - { op: adjustCompanionFriendship, companionId: rogue_mira, delta: -2, onceFlag: ff_cf_act2_camp_mira_fireside_leave }
onEnter: []
---
**Mira** não se senta como soldado: desliza para o chão, joelhos ao peito, olhos na chama — e no teu **maxilar**, a cidade ainda **pesa**.

> *"Fala depressa. O fogo **ouve** melhor que a pedra — e eu ouço melhor que os dois."*

---

{{companionLine}}
