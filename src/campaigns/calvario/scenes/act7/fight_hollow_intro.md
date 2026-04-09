---
id: act7/fight_hollow_intro
title: Procissão oca
chapter: 7
ambientTheme: ash_sky
artKey: hollow_line
choices:
  - text: "Cortar a fila antes que te canonizem sem consentimento"
    effects:
      - op: startCombat
        encounterId: act7_hollow_procession
        onVictory: act7/before_final_horizon
        onDefeat: shared/game_over
        onFlee: act7/before_final_horizon
onEnter:
  - { op: addMark, mark: act7_broke_hollow_line }
  - { op: addDiary, text: "Vieram como procissão — máscaras de osso e hábito rasgado. Não queriam bênção; queriam corpo." }
---
Figuras **alinhadas** demais para serem vivas: **culto** sem olhos, **osso** sem história. Avançam como **ritmo** — e ritmo, no fim, é só outra forma de **cerco**.

---
