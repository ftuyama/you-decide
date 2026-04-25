---
id: act1/encounters/risk_brazier
chapter: 1
ambientTheme: explore
title: Braseiro rachado
choices:
  - text: "Arrancar o selo e engolir o gosto de ferrugem"
    next: act1/dungeon_mouth
    effects:
      - { op: setFlag, key: act2_risk_brazier_done, value: true }
      - { op: addResource, resource: supply, delta: 2 }
      - { op: addResource, resource: faith, delta: -1 }
      - { op: addMark, mark: act2_brazier_scar }
      - { op: addDiary, text: "Rasguei um selo quente e trouxe mantimentos; a fé saiu mais fina." }
    preview: "+2 suprimento, -1 fé e uma marca."
  - text: "Deixar o selo onde está e recuar"
    next: act1/dungeon_mouth
    effects:
      - { op: setFlag, key: act2_risk_brazier_done, value: true }
      - { op: addDiary, text: "Não toquei no braseiro rachado. A fome fica para outro dia." }
    preview: "Sem ganho imediato; sem custo."
---
O **braseiro** está rachado de alto a baixo, e um selo de cera endurecida prende um saco de provisões no fundo da boca de ferro.

O calor não é natural. Se puxares, levas mantimentos — e alguma coisa tua fica colada na cera.
