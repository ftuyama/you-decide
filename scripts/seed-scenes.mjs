/**
 * Gera ficheiros .md em src/campaigns/<id>/scenes/ a partir das strings embebidas.
 * Uso: node scripts/seed-scenes.mjs [--campaign <id>]
 * Default: calvario
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const argv = process.argv.slice(2);
let campaignId = 'calvario';
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--campaign' && argv[i + 1]) {
    campaignId = argv[i + 1];
    i++;
  }
}

const root = path.join(__dirname, '..', 'src', 'campaigns', campaignId, 'scenes');

const scenes = [];

function add(rel, body) {
  scenes.push([rel, body]);
}

add('act1/pick_knight.md', `---
id: act1/pick_knight
chapter: 1
choices:
  - text: "Avançar para a boca da masmorra"
    next: act1/dungeon_mouth
    effects:
      - { op: initClass, class: knight }
      - { op: addRep, faction: vigilia, delta: 1 }
onEnter: []
---
O metal obedece. A **Ordem da Vigília** sussurra aprovação nas dobras da couraça.`);

add('act1/pick_mage.md', `---
id: act1/pick_mage
chapter: 1
choices:
  - text: "Avançar para a boca da masmorra"
    next: act1/dungeon_mouth
    effects:
      - { op: initClass, class: mage }
      - { op: addRep, faction: circulo, delta: 1 }
onEnter: []
---
Símbolos acendem na retina. O **Círculo Cinzento** não perdoa hesitação.`);

add('act1/pick_cleric.md', `---
id: act1/pick_cleric
chapter: 1
choices:
  - text: "Avançar para a boca da masmorra"
    next: act1/dungeon_mouth
    effects:
      - { op: initClass, class: cleric }
      - { op: addRep, faction: vigilia, delta: 1 }
onEnter: []
---
O emblema queima frio na palma. Palavras antigas repelhem o véu.`);

add('act1/dungeon_mouth.md', `---
id: act1/dungeon_mouth
chapter: 1
choices:
  - text: "Entrar na catacumba"
    next: act2/catacomb_entry
    effects:
      - { op: setChapter, chapter: 2 }
      - { op: addResource, resource: supply, delta: -1 }
onEnter: []
---
A boca de pedra range. O ar torna-se **denso**, como lã molhada.`);

add('act2/catacomb_entry.md', `---
id: act2/catacomb_entry
chapter: 2
choices:
  - text: "Explorar o corredor lateral"
    next: act2/rats_choice
  - text: "Seguir a marca de giz"
    next: act2/skeleton_room
  - text: "Parar no cruzeiro (hub)"
    next: act2/hub_catacomb
onEnter: []
---
Um **cruzeiro** de ossos finos aponta três caminhos. O eco mente sobre a distância.`);

add('act2/rats_choice.md', `---
id: act2/rats_choice
chapter: 2
choices:
  - text: "Enfrentar o enxame"
    next: act2/rats_combat_intro
    preview: "Combate: roedores famintos."
onEnter: []
---
**Chiar** alto demais para ser só vento. Olhos rubros no escuro.`);

add('act2/rats_combat_intro.md', `---
id: act2/rats_combat_intro
chapter: 2
choices:
  - text: "Lutar!"
    effects:
      - op: startCombat
        encounterId: rats_cellar
        onVictory: act2/after_rats
        onDefeat: act4/game_over
onEnter: []
---
O chão **vibra**. Prepare os dados.`);

add('act2/after_rats.md', `---
id: act2/after_rats
chapter: 2
choices:
  - text: "Continuar"
    next: act2/hub_catacomb
onEnter:
  - { op: addResource, resource: supply, delta: 1 }
  - { op: setFlag, key: rats_cleared, value: true }
---
Viscos escuros no calcanhar. Uma **vitória pequena** — mas suficiente para respirar.`);

add('act2/skeleton_room.md', `---
id: act2/skeleton_room
chapter: 2
artKey: skeleton
choices:
  - text: "Forçar a porta"
    next: act2/skeleton_combat_intro
onEnter: []
---
Restos armados erguem-se por **hábito**, não por vontade.`);

add('act2/skeleton_combat_intro.md', `---
id: act2/skeleton_combat_intro
chapter: 2
artKey: skeleton
choices:
  - text: "Lutar!"
    effects:
      - op: startCombat
        encounterId: skeleton_hall
        onVictory: act2/hub_catacomb
        onDefeat: act4/game_over
onEnter: []
---
O esqueleto **crange** ao mover-se.`);

add('act2/hub_catacomb.md', `---
id: act2/hub_catacomb
chapter: 2
type: hub
choices:
  - text: "Voltar ao corredor dos ratos"
    next: act2/rats_choice
    condition: { noFlag: rats_cleared }
  - text: "Ir ao mercador fantasma"
    next: act2/merchant_moon
  - text: "Ouvir proposta de Mira"
    next: act2/recruit_offer
    condition: { noFlag: mira_recruited }
  - text: "Ritual do Círculo (evento)"
    next: act2/circle_ritual
  - text: "Acampamento da Vigília"
    next: act2/vigilia_camp
  - text: "Rota aleatória (demo)"
    next: act2/random_router
  - text: "Descer mais fundo"
    next: act3/descent
    effects:
      - { op: setChapter, chapter: 3 }
      - { op: setNarrativeTier, tier: 3 }
onEnter: []
---
O cruzeiro lembra que **toda escolha** tem preço.`);

add('act2/merchant_moon.md', `---
id: act2/merchant_moon
chapter: 2
choices:
  - text: "Aceitar o mapa rasgado"
    next: act2/hub_catacomb
    effects:
      - { op: grantItem, itemId: rumor_map }
      - { op: addResource, resource: supply, delta: -1 }
  - text: "Recusar educadamente"
    next: act2/hub_catacomb
onEnter: []
---
Um capuz sem rosto estende um **mapa**. "Rumores mudam pesos", diz a voz.`);

add('act2/recruit_offer.md', `---
id: act2/recruit_offer
chapter: 2
choices:
  - text: "Recrutar Mira"
    next: act2/recruit_mira
    effects:
      - { op: recruit, companionId: rogue_mira }
      - { op: addRep, faction: circulo, delta: 1 }
  - text: "Seguir sozinho"
    next: act2/hub_catacomb
onEnter: []
---
**Mira** observa das sombras: "Preciso de alguém que não tema o silêncio."`);

add('act2/recruit_mira.md', `---
id: act2/recruit_mira
chapter: 2
choices:
  - text: "Continuar"
    next: act2/hub_catacomb
onEnter:
  - { op: setFlag, key: mira_recruited, value: true }
---
Mira ajusta a adaga. "Menos conversa. **Mais pé**."`);

add('act2/random_router.md', `---
id: act2/random_router
chapter: 2
randomBranch:
  id: rb1
  branches:
    - { weight: 1, next: act2/recruit_offer, condition: { noFlag: mira_recruited } }
    - { weight: 1, next: act2/merchant_moon, condition: { noItem: rumor_map } }
    - { weight: 1, next: act2/wild_encounter_rats }
    - { weight: 1, next: act2/wild_encounter_mixed }
    - { weight: 1, next: act2/wild_encounter_cultist }
    - { weight: 1, next: act2/hub_catacomb }
choices: []
onEnter: []
---
`); // empty body router

add('act3/descent.md', `---
id: act3/descent
chapter: 3
choices:
  - text: "Seguir até o poço"
    next: act3/well_lies
  - text: "Tentar o mapa (rumor)"
    next: act3/cult_passage
    condition: { hasItem: rumor_map }
  - text: "Mapa mini (exploração ASCII)"
    next: act3/ascii_explore
  - text: "Evento de corrupção"
    next: act3/corruption_event
  - text: "Nota no diário"
    next: act3/diary_trigger
    effects:
      - { op: addDiary, text: "O ar cheira a cobre podre." }
onEnter: []
---
A escada **afunda**. O pulso verde pulsa no tempo do teu coração.

Com o **Mapa Rasgado** no inventário, abre-se um atalho narrativo.`);

add('act3/well_lies.md', `---
id: act3/well_lies
chapter: 3
skillCheck:
  id: well
  attr: mind
  tn: 9
  successNext: act3/well_success
  failNext: act3/well_fail
  label: "Discernir o mapa gravado na pedra"
choices: []
onEnter: []
---
O **Poço que Mentiu** reflete um mapa que não corresponde às paredes.`);

add('act3/well_success.md', `---
id: act3/well_success
chapter: 3
choices:
  - text: "Avançar"
    next: act3/hub_depths
onEnter:
  - { op: setFlag, key: well_truth, value: true }
---
Vês o **truque**: espelho deslocado. O caminho real abre à esquerda.`);

add('act3/well_fail.md', `---
id: act3/well_fail
chapter: 3
choices:
  - text: "Avançar mesmo assim"
    next: act3/cult_ambush_scene
onEnter:
  - { op: setFlag, key: false_map, value: true }
---
Acreditas no reflexo. Algo na próxima sala **prepara-te** uma surpresa.`);

add('act3/cult_ambush_scene.md', `---
id: act3/cult_ambush_scene
chapter: 3
choices:
  - text: "Lutar na emboscada!"
    effects:
      - op: startCombat
        encounterId: cult_ambush
        onVictory: act3/hub_depths
        onDefeat: act4/game_over
onEnter: []
---
**Cultistas** já te esperavam. Vantagem deles — dados mostrarão.`);

add('act3/cult_passage.md', `---
id: act3/cult_passage
chapter: 3
choices:
  - text: "Seguir"
    next: act3/hub_depths
onEnter:
  - { op: addRep, faction: culto, delta: 1 }
---
O mapa rasgado **sussurra** onde dobrar. Um símbolo do Terceiro Sino brilha.`);

add('act3/ascii_explore.md', `---
id: act3/ascii_explore
chapter: 3
choices:
  - text: "Sair do mapa"
    next: act3/hub_depths
onEnter:
  - { op: setAsciiMap, mapId: demo5, playerX: 2, playerY: 2 }
---
Usa o **mini-mapa** abaixo. Cada passo pode custar suprimento.`);

add('act3/stone_corridor.md', `---
id: act3/stone_corridor
chapter: 3
choices:
  - text: "Despertar o guardião"
    next: act3/stone_combat_intro
onEnter: []
---
Runas acendem. Um **golem** funerário bloqueia o trono.`);

add('act3/stone_combat_intro.md', `---
id: act3/stone_combat_intro
chapter: 3
choices:
  - text: "Lutar!"
    effects:
      - op: startCombat
        encounterId: stone_guard_fight
        onVictory: act3/hub_depths
        onDefeat: act4/game_over
onEnter: []
---
Pedra **contra** carne. Três camadas de armadura antes da ferida real.`);

add('act3/hub_depths.md', `---
id: act3/hub_depths
chapter: 3
artKey: depths
choices:
  - text: "Rumo ao trono de ossos"
    next: act4/throne_gate
    effects:
      - { op: setChapter, chapter: 4 }
      - { op: addDiary, text: "O trono chama." }
  - text: "Lado do guardião (opcional)"
    next: act3/stone_corridor
  - text: "Voltar ao Cruzeiro — hub"
    next: act2/hub_catacomb
    effects:
      - { op: setChapter, chapter: 2 }
onEnter:
  - { op: clearAsciiMap }
---
Profundezas **silenciosas**. Morvayn não está longe.`);

add('act4/throne_gate.md', `---
id: act4/throne_gate
chapter: 4
choices:
  - text: "Ouvir o necromante"
    next: act4/morvayn_parley
  - text: "Atacar de imediato"
    next: act4/fight_morvayn
onEnter: []
---
O **Trono de Ossos** ergue-se como onda fossilizada. **Morvayn** sorri sem lábios.`);

add('act4/morvayn_parley.md', `---
id: act4/morvayn_parley
chapter: 4
choices:
  - text: "Recusar o pacto e lutar"
    next: act4/fight_morvayn
    effects:
      - { op: addRep, faction: vigilia, delta: 1 }
  - text: "Aceitar servir ao Terceiro Sino"
    next: act4/pact_ascent
    condition: { rep: { faction: culto, gte: 0 } }
    preview: "Corrupção e poder sombrio."
  - text: "Tentar selar o Calvário (sacrifício)"
    next: act4/seal_ending
    condition: { resource: { faith: { gte: 2 } } }
onEnter: []
---
"A paz é **silêncio**", diz Morvayn. "Escolhe o silêncio que preferes ouvir."`);

add('act4/fight_morvayn.md', `---
id: act4/fight_morvayn
chapter: 4
choices:
  - text: "Primeira fase — confronto!"
    effects:
      - op: startCombat
        encounterId: boss_morvayn_1
        onVictory: act4/fight_morvayn_2
        onDefeat: act4/game_over
onEnter: []
---
**Morvayn** levanta o cajado. Os dados decidem.`);

add('act4/fight_morvayn_2.md', `---
id: act4/fight_morvayn_2
chapter: 4
choices:
  - text: "Segunda fase — trono!"
    effects:
      - op: startCombat
        encounterId: boss_morvayn_2
        onVictory: act4/victory_peace
        onDefeat: act4/game_over
onEnter: []
---
O trono **desperta**. Sua forma encorpa-se com ossos alheios.`);

add('act4/victory_peace.md', `---
id: act4/victory_peace
chapter: 4
choices:
  - text: "Epílogo"
    next: act4/epilogue_modular
onEnter:
  - { op: addMark, mark: morvayn_slain }
---
O pulso verde **esmorece**. O mundo respira — um sopro, não um hino.

**Vitória.**`);

add('act4/pact_ascent.md', `---
id: act4/pact_ascent
chapter: 4
choices:
  - text: "Subir à cidade com o eco na nuca"
    next: act4/pact_whispers
onEnter:
  - { op: addDiary, text: "Aceitei o Terceiro Sino. Cada degrau para cima soa como um badalar que só eu ouço." }
---
O **Calvário** deixa-te nas costas como um casulo húmido. O ar da rua acima cheira a chuva velha e a incenso barato — mas por baixo da pele, algo **puxa** para baixo, sempre, como se o mundo tivesse aprendido a obedecer a um ritmo novo.

Um **sino** não toca. Mesmo assim, o teu pulso tenta acompanhar o que não existe.
`);

add('act4/pact_whispers.md', `---
id: act4/pact_whispers
chapter: 4
choices:
  - text: "Deixar o sussurro completar-se"
    next: act4/pact_trial_mind
onEnter:
  - { op: addDiary, text: "Na cidade, as janelas fecham cedo. O silêncio não é paz — é fila." }
---
Entre **vigias** que fingem não ver e mercadores que desviam o olhar, uma voz — não a tua — descreve o que vais fazer antes de pensares.

**"Serve."** Não é pedido. É **compasso**.

O Terceiro Sino não precisa de metal: precisa de **alguém** que carregue o eco sem partir.
`);

add('act4/pact_trial_mind.md', `---
id: act4/pact_trial_mind
chapter: 4
skillCheck:
  id: pact_hold
  attr: mind
  tn: 10
  successNext: act4/pact_after_mind
  failNext: act4/pact_after_mind_fail
  label: "Sustentar o eco do Terceiro Sino na mente"
choices: []
onEnter: []
---
O ruído do mercado **dobra** sobre si mesmo. Vês símbolos onde não há nada — ou há sempre, e só agora consegues **ler**.

Para não te **partires** ao meio, precisas de uma só coisa: manter a cabeça como **câmara** do som, não como o sino.
`);

add('act4/pact_after_mind.md', `---
id: act4/pact_after_mind
chapter: 4
choices:
  - text: "Atravessar a praça sem vacilar"
    next: act4/pact_vigil_skirmish
onEnter: []
---
O eco **assenta**. Não desaparece — aprende o teu nome e cala-se por educação.

Por um instante, sentes o mundo como uma **máquina** bem oleada: cada roda a girar porque **deixas**.
`);

add('act4/pact_after_mind_fail.md', `---
id: act4/pact_after_mind_fail
chapter: 4
choices:
  - text: "Atravessar na mesma — à força"
    next: act4/pact_vigil_skirmish
onEnter:
  - { op: addResource, resource: corruption, delta: 1 }
  - { op: addDiary, text: "O eco escorreu-me pela garganta. Um dente partiu-se na minha atenção — e o Terceiro Sino riu baixinho." }
---
O eco **morde**. Uma faísca atravessa-te os pensamentos como **ferro** em língua.

Ainda serves — mas sentes o preço como **náusea** doce, como mel venenoso colado ao céu da boca.
`);

add('act4/pact_vigil_skirmish.md', `---
id: act4/pact_vigil_skirmish
chapter: 4
choices:
  - text: "Responder ao aço da Vigília"
    effects:
      - op: startCombat
        encounterId: vigil_hunter_fight
        onVictory: act4/pact_coda
        onDefeat: act4/game_over
onEnter:
  - { op: addRep, faction: vigilia, delta: -1 }
  - { op: addDiary, text: "Um caçador da Vigília reconheceu o meu passo — não o meu rosto. O pacto cheira a traição para quem jura pela luz." }
---
Do lado da **sombra** de um chafariz, um arqueiro da **Vigília** corta-te o caminho. Não vem com sermão — vem com **certeza**.

"**Servo** não é cidadão", diz. "É **ferida** aberta na cidade."
`);

add('act4/pact_coda.md', `---
id: act4/pact_coda
chapter: 4
choices:
  - text: "Aceitar o que ficou escrito em ti"
    next: act4/epilogue_modular
onEnter:
  - { op: addResource, resource: corruption, delta: 3 }
  - { op: addMark, mark: pact_bound }
  - { op: grantItem, itemId: third_bell }
  - { op: addDiary, text: "Servi ao Terceiro Sino. O anel no dedo não toca — mas o mundo aprendeu a calar quando eu respiro." }
---
O caçador cai — ou foge — e o que fica é **clareza** húmida: a cidade não dorme; **aprende** a fingir.

Serves ao **Terceiro Sino**. Não como vassalo de coroa, mas como **conduto**: cada passo teu é uma batida que não precisa de torre, porque a torre **soubeste** tu.

Um frio fino sobe do Calvário até à pele da cidade. As pessoas falam baixo não por medo do crime — por medo de **acertarem** no ritmo errado e o chão lhes **lembrar** quem manda no silêncio.

No dedo, o **anel** pesa como um sino fechado numa caixa: **mudo** para os outros, ensurdecedor para ti.

Quando a noite acaba, o dia chega **obediente**. E tu — tu ouves o quarto toque que nunca foi fundido, apenas **prometido**.
`);

add('act4/epilogue_close.md', `---
id: act4/epilogue_close
chapter: 4
choices: []
onEnter: []
---
O diário **fecha**. O que ficou ficou — o que perdeste, o que escolheste.

*(Podes **salvar** o jogo no menu ou **recomeçar** quando quiseres.)*
`);

add('act5/frost_opening.md', `---
id: act5/frost_opening
chapter: 5
artKey: frost_peaks
choices:
  - text: "Subir o desfiladeiro gelado"
    next: act5/frost_ridgeline
onEnter:
  - { op: setChapter, chapter: 5 }
  - { op: addResource, resource: supply, delta: -1 }
  - { op: addDiary, text: "Ordem do culto: nas Cimeiras há um dragão que não pede permissão ao Sino. Devo trazer-lhe o silêncio — ou o contrário." }
---
## Cimeiras do Vento Cinzento

O mapa que te deram não é de estradas — é de **sombras** sobre neve. Cada marco é um aviso: *aqui o vento corta quem fala alto*.

Ainda assim, o **Terceiro Sino** ressoa na tua tempestade interior, mais alto que o vendaval. Serve-te de **bússola** ou de **âncora** — não há terceira coisa.

O rumor fala de **Vetrnax**: não uma fera qualquer, mas um **fio** de geada tão antigo quanto a primeira noite em que o mundo aprendeu a ter medo do céu.
`);

add('act5/frost_ridgeline.md', `---
id: act5/frost_ridgeline
chapter: 5
choices:
  - text: "Seguir o rasto de garras na neve"
    next: act5/frost_whelp_pack
onEnter:
  - { op: addDiary, text: "A neve não mente: algo grande deslizou aqui. E algo pequeno ainda espreita." }
---
A **cordilheira** não acolhe. O ar torna-se **lâmina**; cada respiração é um preço cobrado ao peito.

Longe, um **estalido** — não trovão, mas gelo a **partir-se** sob peso impossível.

Vês **pegadas** que não são humanas, e um rasto de **cristais** azuis como veias expostas na neve.
`);

add('act5/frost_whelp_pack.md', `---
id: act5/frost_whelp_pack
chapter: 5
choices:
  - text: "Lutar contra as crias de geada"
    effects:
      - op: startCombat
        encounterId: frost_whelps
        onVictory: act5/frost_lair_approach
        onDefeat: act4/game_over
onEnter: []
---
Duas **crias** rodeiam-te com fome de calor vivo. Os olhos delas são **buracos** onde o luar foi congelado.

Se passares, o covil deixa de ser rumor — torna-se **porta**.
`);

add('act5/frost_lair_approach.md', `---
id: act5/frost_lair_approach
chapter: 5
artKey: ice_dragon
choices:
  - text: "Entrar na câmara do hálito branco"
    next: act5/fight_ice_dragon
onEnter:
  - { op: addDiary, text: "O covil não cheira a enxofre — cheira a tempestade adiada. Vetrnax dorme acordado." }
---
Uma **galeria** de gelo espelha o teu rosto em dez versões — nenhuma **inteira**.

No fundo, a sombra **respira** e o ar enche-se de **agulhas** invisíveis. Duas fileiras de dentes como **serras** de inverno abrem-se num sorriso que não é para ti.

É para o **céu**, que por um instante hesita em cair.
`);

add('act5/fight_ice_dragon.md', `---
id: act5/fight_ice_dragon
chapter: 5
choices:
  - text: "Primeira fase — o hálito gela o ar"
    effects:
      - op: startCombat
        encounterId: boss_ice_dragon_1
        onVictory: act5/fight_ice_dragon_2
        onDefeat: act4/game_over
onEnter: []
---
**Vetrnax** desenrola o pescoço como uma **corda** de trovão. O primeiro assalto não é dente — é **frio** que rouba o som da língua.
`);

add('act5/fight_ice_dragon_2.md', `---
id: act5/fight_ice_dragon_2
chapter: 5
choices:
  - text: "Segunda fase — partir o coração da geada"
    effects:
      - op: startCombat
        encounterId: boss_ice_dragon_2
        onVictory: act5/frost_epilogue
        onDefeat: act4/game_over
onEnter: []
---
O dragão **rasga** o próprio rugido e deixa entrar um **silêncio** pior que o barulho.

No peito dele, algo **pulsar** — não sangue, mas uma **nota** presa, como um sino fundido ao osso.

Se o partires, o Terceiro Sino ouve — ou **cala** para sempre.
`);

add('act5/frost_epilogue.md', `---
id: act5/frost_epilogue
chapter: 5
choices:
  - text: "Guardar este fim nas montanhas e encerrar o diário"
    next: act4/epilogue_close
onEnter:
  - { op: grantItem, itemId: frost_wyrm_scale }
  - { op: addMark, mark: vetrnax_slain }
  - { op: addDiary, text: "Vetrnax caiu. O gelo partiu-se como vidro — e por baixo, por um instante, ouvi o Terceiro Sino a aprender um nome novo." }
---
**Vetrnax** desfaz-se em **cascata** de cristais. O vento, que antes mordia, agora só **sussurra** — como quem repete uma ordem sem acreditar.

Na tua mão, uma **escama** tão fria que queima: troféu, relíquia, **prova** de que o culto não é o único som no mundo.

O rumor das Cimeiras vai mudar. Alguns dirão que o dragão morreu; outros, que **dorme** num eco mais profundo.

Tu sabes a verdade **húmida** do pacto: cada vitória é outra **corda** — e o Sino adora quem puxa sem se queixar.
`);




add('act4/seal_ending.md', `---
id: act4/seal_ending
chapter: 4
choices:
  - text: "Fim"
    next: act4/epilogue_modular
onEnter:
  - { op: addResource, resource: faith, delta: -2 }
  - { op: addMark, mark: calvario_sealed }
---
Selas o **Calvário** com preço. Cicatrizes na alma; paz frágil nas pedras.`);

add('act4/epilogue_modular.md', `---
id: act4/epilogue_modular
chapter: 4
choices:
  - text: "Partir para as Cimeiras do Vento Cinzento — caçar o rumor do gelo"
    next: act5/frost_opening
    condition: { mark: pact_bound }
    preview: "Capítulo 5. O culto não perdoa rivais nem altitude."
  - text: "Apagar a luz desta memória e encerrar o diário"
    next: act4/epilogue_close
onEnter: []
---
## Epílogo

Marcas: **{{corruption}}** de corrupção ecoam na carne.

Diário final: o mundo continua — **menos** um necromante, ou **mais** um trono.

Se o Terceiro Sino te **nomeou**, o frio longínquo pode ser o único sítio onde o som não te alcança — ou onde **aprendes** a tocá-lo de outra forma.
`);

add('act4/game_over.md', `---
id: act4/game_over
chapter: 4
choices:
  - text: "Recomeçar"
    effects:
      - { op: resetRun }
onEnter: []
---
# GAME OVER

O Calvário **engole** outra alma. Tente novamente.`);

add('act2/chapter2_gate.md', `---
id: act2/chapter2_gate
chapter: 2
chapterGate:
  minSupply: 1
  passNext: act2/hub_catacomb
  failNext: act2/supply_fail
choices: []
onEnter: []
---
`);

add('act2/supply_fail.md', `---
id: act2/supply_fail
chapter: 2
choices:
  - text: "Arrastar-se para a saída"
    next: act1/dungeon_mouth
onEnter: []
---
Sem suprimento, o corpo **traí** o espírito.`);

add('act1/map_tutorial.md', `---
id: act1/map_tutorial
chapter: 1
choices:
  - text: "Sair"
    next: act1/dungeon_mouth
onEnter:
  - { op: setAsciiMap, mapId: demo5, playerX: 1, playerY: 1 }
---
Tutorial do **mapa ASCII** (opcional).`);

add('act3/diary_trigger.md', `---
id: act3/diary_trigger
chapter: 3
choices:
  - text: "Voltar"
    next: act3/hub_depths
onEnter: []
---
Uma sensação **grava** no diário.`);

add('act2/circle_ritual.md', `---
id: act2/circle_ritual
chapter: 2
choices:
  - text: "Participar"
    next: act2/hub_catacomb
    effects:
      - { op: addResource, resource: corruption, delta: 1 }
      - { op: addRep, faction: circulo, delta: 1 }
  - text: "Recusar"
    next: act2/hub_catacomb
onEnter: []
---
Um mago do **Círculo** desenha cinza no chão. "Um preço leve", diz.`);

add('act2/vigilia_camp.md', `---
id: act2/vigilia_camp
chapter: 2
choices:
  - text: "Continuar"
    next: act2/hub_catacomb
onEnter:
  - { op: addRep, faction: vigilia, delta: 1 }
---
Soldados da **Vigília** partilham pão seco. Honra tem gosto de cinza.`);

add('act3/corruption_event.md', `---
id: act3/corruption_event
chapter: 3
choices:
  - text: "Tocar o cristal"
    next: act3/hub_depths
    effects:
      - { op: addResource, resource: corruption, delta: 1 }
  - text: "Ignorar"
    next: act3/hub_depths
onEnter: []
---
Um **cristal** verde pulsa. O Eco do Calvário responde.`);

add('act4/sino_puzzle.md', `---
id: act4/sino_puzzle
chapter: 4
choices:
  - text: "◇ ◈ ◇ (sequência do Terceiro Sino)"
    next: act4/throne_gate
    effects:
      - { op: setFlag, key: sino_solved, value: true }
      - { op: addDiary, text: "As runas do sino alinharam-se — o trono ouviu antes de eu chegar." }
  - text: "◈ ◇ ◈ (eco invertido — provar outro ritmo)"
    next: act4/throne_gate
    effects:
      - { op: addResource, resource: supply, delta: -1 }
      - { op: addResource, resource: corruption, delta: 1 }
      - { op: addDiary, text: "Inverti o compasso. O sino não tocou, mas algo mordeu-me por dentro." }
  - text: "◇ ◇ ◈ (pressa — apagar e avançar)"
    next: act4/throne_gate
    effects:
      - { op: addResource, resource: supply, delta: -2 }
      - { op: addResource, resource: faith, delta: -1 }
      - { op: addDiary, text: "Forcei a sequência. O metal lembrou-me que pressa também é erro." }
onEnter: []
---
**Sino ao Luar**: alinhas runas numa pedra que **respira**. O eco agradece, **morde**, ou finge obediça — conforme a ordem em que tocas o silêncio.

Cada padrão é uma **promessa** diferente ao trono.
`);

add('act1/breadcrumb_test.md', `---
id: act1/breadcrumb_test
chapter: 1
choices:
  - text: "Voltar"
    next: act1/title
onEnter: []
---
Teste de **breadcrumb** no caminho do ficheiro.`);

add('act2/encounter_stub_a.md', `---
id: act2/encounter_stub_a
chapter: 2
choices:
  - text: "Seguir"
    next: act2/hub_catacomb
onEnter: []
---
Cena curta **A**.`);

add('act2/encounter_stub_b.md', `---
id: act2/encounter_stub_b
chapter: 2
choices:
  - text: "Seguir"
    next: act2/hub_catacomb
onEnter: []
---
Cena curta **B**.`);

add('act3/depths_stub.md', `---
id: act3/depths_stub
chapter: 3
choices:
  - text: "Ao hub"
    next: act3/hub_depths
onEnter: []
---
Passagem **estreita**.`);

add('act4/final_stub.md', `---
id: act4/final_stub
chapter: 4
choices:
  - text: "Ao trono"
    next: act4/throne_gate
onEnter: []
---
Último **corredor**.`);

for (const [rel, body] of scenes) {
  const p = path.join(root, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, body);
}

console.log(`Wrote ${scenes.length} scenes → campaigns/${campaignId}/scenes`);
