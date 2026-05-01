---
id: act2/luck_mire_safe
chapter: 2
ambientTheme: act2
title: Fio de sorte
onEnter:
  - { op: grantTemporaryBuff, attr: str, delta: 2, remainingScenes: 3 }
  - { op: addXp, amount: 14 }
  - { op: addDiary, text: "O lodo deu-me um fio de força — não sei quanto tempo dura." }
choices:
  - text: "Afastar-se e voltar ao cruzeiro"
    next: act2/hub_catacomb
---
O lodo **solta** o braço como quem **perde** interesse. Ficas com um **calor** mentiroso nos músculos — **breve**, mas suficiente para um soco a mais.
