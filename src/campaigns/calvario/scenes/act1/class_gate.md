---
id: act1/class_gate
title: O espelho d'água
chapter: 1
ambientTheme: explore
artKey: class_gate
choices:
  - text: "[#] Forjar o caminho como Cavaleiro"
    next: act1/pick_knight
    preview: "Honra da Vigília; combate corpo a corpo."
    timedMs: 15000
    fallbackNext: act1/class_gate_water
  - text: "[*] Desvendar segredos como Mago"
    next: act1/pick_mage
    preview: "Rituais do Círculo; mente afiada."
  - text: "[+] Abrir passagem como Clérigo"
    next: act1/pick_cleric
    preview: "Fé e purificação contra mortos-vivos."
  - text: "Olhar fixamente a água negra: o que reflecte?"
    next: act1/class_gate_water
  - text: "Ouvir: há outro som além do gotejar?"
    next: act1/class_gate_listen
  - text: "Um espelho de mão na parede — segurá-lo e ver-te sem a água"
    next: act1/mirror_round
onEnter: []
---
Três **juramentos** ecoam numa câmara redonda. No centro, uma lâmina de **água negra** não move — mas o teu reflexo demora um instante a seguir-te, como se hesitasse entre **espada**, **arco de luz** e **símbolo sagrado**.

O ar cheira a **incenso queimado** e a ferro.
