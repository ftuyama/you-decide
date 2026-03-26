---
id: act6/hub_fractured_nave
title: Nave Fraturada
chapter: 6
type: hub
ambientTheme: explore
choices:
  - text: "Seguir o corredor dos espelhos partidos (Prova da Realidade)"
    next: act6/reality_trial
    condition: { noFlag: act6_reality_done }
  - text: "Descer ao poço de memórias sem fundo (Prova da Memória)"
    next: act6/memory_trial
    condition: { noFlag: act6_memory_done }
  - text: "Subir ao altar da vontade nua (Prova da Vontade)"
    next: act6/will_trial
    condition: { noFlag: act6_will_done }
  - text: "Atravessar o Portão do Espelho Interior"
    next: act6/mirror_gate
    condition:
      all:
        - { flag: act6_reality_done }
        - { flag: act6_memory_done }
        - { flag: act6_will_done }
onEnter: []
---
Três corredores respiram à tua frente, cada um com uma mentira diferente sobre o que é viver. Não há mapa aqui; só **versões**.

No teto, rachaduras formam constelações impossíveis. Uma delas lembra o teu rosto em idade avançada. Outra, o teu rosto sem culpa.

Se queres sair inteiro, vais precisar de aceitar que inteiro talvez seja uma forma elegante de dizer **incompleto**.

