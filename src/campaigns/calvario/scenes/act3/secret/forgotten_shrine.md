---
id: act3/secret/forgotten_shrine
title: Santuário esquecido
chapter: 3
ambientTheme: act3
artKey: forgotten_shrine
choices:
  - text: "Tocar a runa central — lembrar o silêncio antes do nome"
    uiSection: "Selo"
    next: act3/hub_depths
    condition:
      all:
        - { resource: { faith: { gte: 2 } } }
        - { noFlag: act3_shrine_done }
    preview: "Fé responde à fé; o selo abre devagar."
    effects:
      - { op: setFlag, key: act3_shrine_done, value: true }
      - { op: addXp, amount: 25 }
      - { op: addDiary, text: "O santuário aceitou-me — não como heróica visita, mas como quem fechou a porta antes de partir." }
  - text: "[*] Sussurrar a fórmula contida — escutar o que o selo guarda"
    uiSection: "Selo"
    next: act3/hub_depths
    condition:
      all:
        - { class: mage }
        - { noFlag: act3_shrine_done }
    preview: "Mente sobre runa; conhecimento custa um suprimento."
    effects:
      - { op: setFlag, key: act3_shrine_done, value: true }
      - { op: addResource, resource: supply, delta: -1 }
      - { op: addXp, amount: 30 }
      - { op: addDiary, text: "A runa não pediu sangue — pediu atenção. O caderno engordou de uma página que nem sei se foi minha." }
  - text: "[!] Forçar a abertura — quebrar o selo com o ferro"
    uiSection: "Selo"
    next: act3/hub_depths
    condition:
      all:
        - { class: knight }
        - { noFlag: act3_shrine_done }
    preview: "Ferro contra silêncio; ouro e custo."
    effects:
      - { op: setFlag, key: act3_shrine_done, value: true }
      - { op: addResource, resource: corruption, delta: 1 }
      - { op: addResource, resource: gold, delta: 3 }
      - { op: addDiary, text: "Quebrei o que pedia paciência; o eco fechou-se sobre mim como gola." }
  - text: "Recuar do santuário sem tocar"
    uiSection: "Partir"
    next: act3/hub_depths
    condition: { noFlag: act3_shrine_done }
    preview: "Fingir que não viste."
    effects:
      - { op: setFlag, key: act3_shrine_done, value: true }
      - { op: addDiary, text: "Há santuários que pedem para serem deixados em paz — fingi obediência por hoje." }
  - text: "Lembrar o santuário (já visitado)"
    uiSection: "Partir"
    next: act3/hub_depths
    condition: { flag: act3_shrine_done }
    preview: "O selo lembra-te como lembras dele."
onEnter: []
---
Atrás de um **véu** de pedra rachada — quase parede, quase porta — o chão **abre** numa antessala que não estava no mapa. Lajes baixas, **runas** seladas com chumbo, água parada que **espelha** sem refletir.

No centro, uma **runa** maior. Ninguém a desenhou para ser **lida** por intrusos: foi traçada por quem ia partir e queria deixar **algo** trancado para sempre. Há um **cheiro** de incenso velho, demasiado velho, que ninguém manda mais queimar.

Não há altar. Há **promessas** dobradas entre as juntas das pedras. Uma delas **abrir-se-ia** se a tocares.
