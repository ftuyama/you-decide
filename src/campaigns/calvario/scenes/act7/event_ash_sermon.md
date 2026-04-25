---
id: act7/event_ash_sermon
title: Pregação na cinza
chapter: 7
ambientTheme: ash_sky
artKey: ash_sermon
choices:
  - text: "Atirar uma moeda ao prato e seguir — caridade também cansa"
    next: act7/before_final_horizon
onEnter:
  - { op: addMark, mark: act7_heard_ash_sermon }
  - { op: addResource, resource: gold, delta: -1 }
  - { op: addRep, faction: vigilia, delta: 1, directGain: true }
  - { op: addDiary, text: "Um pregador sem rosto pediu esmola em nome de um deus que já não tem cidade. Paguei para ele calar antes de eu calar." }
---
**Pregador** cinzento gesticula para **fenda** no sítio do céu — plateia vazia, gesto de fim **oficial**.

Ou ris, ou pagas para o riso não virar **culpa** — hoje: **moeda** e reputação com quem finge ordem.
