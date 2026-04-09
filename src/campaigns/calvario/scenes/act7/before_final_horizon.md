---
id: act7/before_final_horizon
title: Antes do último horizonte
chapter: 7
ambientTheme: ash_sky
artKey: last_horizon
choices:
  - text: "Oferecer fé como moeda — comprar silêncio ao céu por um instante"
    next: act7/epilogue_apocalypse
    condition: { resource: { faith: { gte: 1 } } }
    effects:
      - { op: addResource, resource: faith, delta: -2 }
      - { op: addMark, mark: act7_paid_sky_in_faith }
      - { op: addDiary, text: "Paguei o céu com o que ainda tinha de vertical. Sobrou corpo — não sobrou desculpa." }
    preview: "−2 fé · marca de trégua comprada"
  - text: "Dar o que resta de humano ao rumor — deixar a pele aprender o preço"
    next: act7/epilogue_apocalypse
    effects:
      - { op: addResource, resource: corruption, delta: 1 }
      - { op: addResource, resource: supply, delta: -1 }
      - { op: addMark, mark: act7_sealed_in_ember }
      - { op: addDiary, text: "Não negociei com Deus — negociei com o fogo. O resultado é o mesmo: menos pele, mais verdade." }
    preview: "+1 corrupção · −1 suprimento · marca"
  - text: "Seguir sem oferta — só o passo nu"
    next: act7/epilogue_apocalypse
    effects:
      - { op: addMark, mark: act7_walked_bare }
      - { op: addDiary, text: "Não deixei oferta no altar do fim — deixei pegadas. Se o mundo cobrar depois, já saberá onde me encontrar." }
    preview: "Marca de recusa — sem alteração de recursos"
onEnter: []
---
O horizonte **descobre** a última linha: não é fronteira — é **recibo**. Aqui, *oferecer* não é virtude; é **contrato** com o que vem depois do fim fingir que não olha para trás.

O vento **para** outra vez. Desta vez não é cortesia — é **expectativa**.
