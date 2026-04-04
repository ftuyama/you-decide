---
id: act2/recruit_mira
title: Mira Junta-se ao Grupo
chapter: 2
ambientTheme: explore
artKey: mira_offer
choices:
  - text: "Continuar"
    next: act2/hub_catacomb
onEnter:
  - { op: setFlag, key: mira_recruited, value: true }
---
Mira ajusta a adaga. "Menos conversa. **Mais pé**."
