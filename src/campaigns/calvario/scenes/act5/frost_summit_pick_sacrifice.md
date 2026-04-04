---
id: act5/frost_summit_pick_sacrifice
title: Quem paga o preço
chapter: 5
ambientTheme: ancient_macabre
artKey: frost_summit_ritual
choices:
  - text: "Oferecer Mira ao altar — sem teatro, sem volta"
    condition: { companionInParty: rogue_mira }
    preview: "Sem carregar o gesto a tempo, recuas ao umbral."
    timedMs: 12000
    fallbackNext: act5/frost_summit_temple_gate
    effects:
      - { op: dismissCompanion, companionId: rogue_mira }
    next: act5/frost_summit_ritual_blood
  - text: "Oferecer Tomás ao altar — juramento quebrado em sangue"
    condition: { companionInParty: squire_tomas }
    preview: "Sem carregar o gesto a tempo, recuas ao umbral."
    timedMs: 12000
    fallbackNext: act5/frost_summit_temple_gate
    effects:
      - { op: dismissCompanion, companionId: squire_tomas }
    next: act5/frost_summit_ritual_blood
  - text: "Não consigo — voltar ao umbral"
    next: act5/frost_summit_temple_gate
onEnter:
  - { op: addDiary, text: "O altar não pede nome. Pede presença. E eu escolhi quem ia ficar ausente." }
---
O **altar** não brilha; **absorve**. Runas comem luz como quem come **vergonha**. Para abrir o que dorme por baixo do nome “**deuses antigos**”, alguém tem de **deixar de ser gente** no mundo — e alguém tem de **pagar** essa ausência em carne **próxima**.

Escolhe com **mãos firmes**. Depois disto, não há **desculpa** bonita.
