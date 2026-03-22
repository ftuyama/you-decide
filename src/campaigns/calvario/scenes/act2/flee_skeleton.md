---
id: act2/flee_skeleton
chapter: 2
title: Fuga — ossos a perseguir
choices:
  - text: "Voltar ao cruzeiro"
    next: act2/hub_catacomb
onEnter:
  - { op: addResource, resource: supply, delta: -1 }
  - { op: addDiary, text: "Corri de um morto que caminhava demasiado depressa." }
---
O esqueleto **não cansa** — tu cansas. Cada **estalido** atrás de ti parece **perguntas** que não queres responder.

Na curva, um **osso** solto rola-te por baixo dos pés — o chão também **colabora** com o inimigo.
