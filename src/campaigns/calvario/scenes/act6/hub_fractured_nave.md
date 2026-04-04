---
id: act6/hub_fractured_nave
title: Nave Fraturada
chapter: 6
type: hub
ambientTheme: void
artKey: fractured_nave
choices:
  - text: "Seguir o corredor dos espelhos partidos (Prova da Realidade)"
    next: act6/reality_trial
    condition:
      all:
        - { noFlag: act6_reality_done }
        - { level: { gte: 25 } }
  - text: "Descer ao poço de memórias sem fundo (Prova da Memória)"
    next: act6/memory_trial
    condition:
      all:
        - { noFlag: act6_memory_done }
        - { level: { gte: 25 } }
  - text: "Subir ao altar da vontade nua (Prova da Vontade)"
    next: act6/will_trial
    condition:
      all:
        - { noFlag: act6_will_done }
        - { level: { gte: 25 } }
  - text: "Atravessar o Portão do Espelho Interior"
    next: act6/mirror_gate
    condition:
      all:
        - { flag: act6_reality_done }
        - { flag: act6_memory_done }
        - { flag: act6_will_done }
        - { level: { gte: 30 } }
  - text: "Acender a fogueira de cinzas espelhadas (acampamento)"
    next: act6/void_camp
  - text: "Negociar com o mercador da banca esquecida"
    next: act6/fractured_merchant
  - text: "Vagar entre as colunas — o vazio escolhe o próximo passo"
    next: act6/fractured_void_router
  - text: "Ouvir o sussurro sob as colunas (rota de corrupção)"
    next: act6/void_secret_entry
    condition:
      all:
        - { resource: { corruption: { gte: 4 } } }
        - { noFlag: act6_void_pact }
        - { level: { gte: 30 } }
onEnter: []
---
Três corredores respiram à tua frente, cada um com uma mentira diferente sobre o que é viver. Não há mapa aqui; só **versões**.

No teto, rachaduras formam constelações impossíveis. Uma delas lembra o teu rosto em idade avançada. Outra, o teu rosto sem culpa.

Se queres sair inteiro, vais precisar de aceitar que inteiro talvez seja uma forma elegante de dizer **incompleto**.

Entre colunas partidas, alguém **aquece** uma fogueira que não deveria existir — e mais adiante, uma **banca** sem dono expõe remédios como se o vazio fosse cliente **habitué**.

