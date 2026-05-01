import type { JourneyMarkDef } from '../../../engine/data/gameData.ts';

/**
 * Marcas da jornada (`state.marks`): texto para diário, toasts e badges.
 * Passivos de história do líder: `passives.ts` (`leadStoryPassives`) + `grantLeadStoryPassive`.
 */
export const journeyMarks: Record<string, JourneyMarkDef> = {
  act1_surface_whisper_intel: {
    name: 'Rumor que paga',
    description:
      'No subterrâneo da cidade, ouviste o que importa: nomes, horas, rotas — informação que vale ouro, sem pedir milagre.',
  },
  act1_surface_whisper_taint: {
    name: 'Riso na língua',
    description:
      'Algo na superfície devolveu um riso que não era teu; o eco ficou na boca como metal velho, e o subsolo lembrou-se do teu gosto.',
  },
  act3_cult_flight: {
    name: 'Fuga sob capuzes',
    description:
      'Correste da emboscada com o Terceiro Sino na nuca: suprimento perdido, vigília desconfiada, e um naco de sombra a somar-se à corrupção.',
  },
  act3_well_truth: {
    name: 'Verdade no poço',
    description:
      'Viste o truque do espelho: o reflexo mentia, o caminho real abriu à esquerda. Sabes ler armadilhas que se fingem claridade.',
  },
  act3_well_snare: {
    name: 'Reflexo enganador',
    description:
      'Acreditaste no que o poço mostrou; o mapa mentiu. A próxima sala guarda a surpresa que escolheste não ver a tempo.',
  },
  act3_rune_tuned: {
    name: 'Ritmo de pedra domado',
    description:
      'Sintonizaste o pulso das runas; por instantes a tumba obedece à tua atenção, e o pensamento sobe mais limpo.',
  },
  act3_rune_jarred: {
    name: 'Eco nas runas',
    description:
      'O compasso das runas negou-te; um choque seco nos tendões, passos meio-tempo atrasados — a parede lembraste que apressar não é dominar.',
  },
  act6_memory_kept: {
    name: 'Memória intacta',
    description:
      'No julgamento do véu, escolheste não sangrar o que guardas; o preço foi outro, mas o núcleo ficou teu.',
  },
  act6_memory_spoiled: {
    name: 'Memória manchada',
    description:
      'Deixaste a prova rasgar o que eras; a lembrança saiu contaminada — útil talvez, mas já não inocente.',
  },
  act6_shadow_faced: {
    name: 'Sombra encarada',
    description:
      'No espelho final, não fugiste ao duplo; nomear o reflexo custou, mas arrancaste presença ao vazio.',
  },
  act6_veil_aligned: {
    name: 'Véu alinhado',
    description:
      'No tímpano do real, escolheste foco em vez de fuga; o mundo continua mentiroso, mas tu aprendeste onde pisa.',
  },
  act6_veil_broken: {
    name: 'Véu em estilhaços',
    description:
      'Preferiste estilhaçar a cortina; o ruído que entráveis não filtra bem — vês demais ou de menos, mas já não como antes.',
  },
  act6_void_pact_mark: {
    name: 'Marca do pacto vazio',
    description:
      'Reivindicaste o segredo do Vazio por nome; assinatura sem tinta, mas a narrativa lembra a quem cedeu o último grão.',
  },
  act6_will_direct: {
    name: 'Vontade à frente',
    description:
      'No desafio da vontade, cortaste em linha recta; pouca dança, muito embate — o teu caminho não pediu permição.',
  },
  act6_will_measured: {
    name: 'Vontade medida',
    description:
      'Trocaste ferro por cálculo; duelo limpo, passos contados — vitória que sabe a disciplina, não a sorte.',
  },
  act6_will_scattered: {
    name: 'Vontade em fuga',
    description:
      'A horda partiu a tua concentração em retalhos; sobreviveste em dispersão — honra de quem atravessa caos sem fingir ordem.',
  },
  act7_bell_ate_promise: {
    name: 'Promessa digerida',
    description:
      'O sino silencioso ofereceu pacto em susurro; escolheste engolir a promessa — sabor de futuro que não descreves por palavras.',
  },
  act7_bell_paid_faith: {
    name: 'Sino pago em fé',
    description:
      'Pagaste o sino com o que não se pesa; a campainha mudou de dono e tu ficaste com o eco na consciência.',
  },
  act7_broke_hollow_line: {
    name: 'Linha oca partida',
    description:
      'Partiste a formação do vazio armado; o que era parede tornou-se brecha — testemunha de quem não cedeu ao desfile.',
  },
  act7_cinder_burned: {
    name: 'Marca da cinza',
    description:
      'O dízimo de cinzas exigiu mais do que deste; queimaste na recusa ou na falha — pele lembra o forno que te mediu.',
  },
  act7_cinder_favored: {
    name: 'Favorecido pela cinza',
    description:
      'O dízimo aceitou o teu tributo; favorecido pela corrente que consome — não é bênção limpa, é reconhecimento de quem paga.',
  },
  act7_ember_witness: {
    name: 'Testemunha do braseiro',
    description:
      'Seguiste o devorador de brasas até onde a narrativa arde; testemunhaste o fim sem virar cinza — susto que fica na retina.',
  },
  act7_heard_ash_sermon: {
    name: 'Sermão de cinza',
    description:
      'Ouviste os versículos do último pregador de cinzas; a homilia não pede amém, pede silêncio — e guardaste ambos.',
  },
  act7_last_train_rider: {
    name: 'Último comboio',
    description:
      'Montaste o rumor do último trem; passageiro de uma linha que não existe no mapa — chegada onde o calendário desiste.',
  },
  act7_paid_sky_in_faith: {
    name: 'Céu pago em fé',
    description:
      'Antes do horizonte final, ofertaste convicção ao teto mentiroso; o céu ficou com dívida e tu com o arranhão da troca.',
  },
  act7_sealed_in_ember: {
    name: 'Selado no braseiro',
    description:
      'Escolheste fechar o ciclo no calor que não perdoa; selo de brasas — menos palavra, mais cicatriz viva.',
  },
  act7_sky_stitch_torn: {
    name: 'Costura do céu rasgada',
    description:
      'A costura falhou; o pano do firmamento escapou entre teus dedos — vergonha de quem tentou remendar o impossível e ouviu o estoirar.',
  },
  act7_sky_stitch_true: {
    name: 'Costura verdadeira',
    description:
      'Puxaste o fio até ele obedecer; o céu não ficou perfeito, mas deixou de sangrar por essa frente — ofício de quem não desistiu.',
  },
  act7_walked_bare: {
    name: 'Passo nu',
    description:
      'Recusaste armadura narrativa diante do fim; caminhaste nu de metáforas — exposição que é coragem ou loucura, e talvez as duas.',
  },
  calvario_sealed: {
    name: 'Masmorra selada',
    description:
      'Carregaste o peso do selo em ti; o subsolo cala — silêncio de pedra — porque assumiste o custo em fé e cicatriz, em vez de emprestar o rumor.',
  },
  fled_rats: {
    name: 'Retirada dos ratos',
    description:
      'Escolheste não medir forças com a maré de dentes; sobreviveste a custa de orgulho — quem foge hoje conta a história amanhã.',
  },
  act2_brazier_scar: {
    name: 'Cicatriz do braseiro',
    description:
      'Rasgaste o selo quente por mantimentos e deixaste fé na cera. Prova de que sobrevivência também cobra devoção.',
  },
  mira_camp_shadows: {
    name: 'Sombras com a Mira',
    description:
      'No acampamento, a Mira partilhou o que esconde sob o riso; confiança de quem vê no escuro sem pedir lanterna.',
  },
  mira_cruzeiro_confidencia: {
    name: 'Confidência no cruzeiro',
    description:
      'Trocámo-nos verdades fracas no hub; ela guarda um sítio no teu mapa emocional que o mapa de pedra não tem.',
  },
  mira_frost_pact: {
    name: 'Pacto de geada',
    description:
      'No gelo, a Mira amarrou palavra contigo; promessa que congela antes de partir — lealdade que não derrete com o primeiro sol.',
  },
  mira_void_endtalk: {
    name: 'Última conversa no vazio',
    description:
      'No fim do arco, ela falou como quem já despediu o corpo; ficaste com a frase que não cabe em inventário.',
  },
  monk_inner_peace: {
    name: 'Paz interior',
    description:
      'Na neve acima da tempestade, um monge sem rosto deixou-te um silêncio que não pede nome — encerramento, não promessa; o peito aprendeu a respirar sem truque.',
  },
  morvayn_slain: {
    name: 'Morvayn findado',
    description:
      'Ferro no trono; Morvayn caiu por tua mão. Carregas a limpeza suja de quem mata para calar um nome demasiado alto.',
  },
  pact_bound: {
    name: 'Pacto do Terceiro Sino',
    description:
      'Assinaste o silêncio em pele; o Culto inscreveu-se em corrupção que sobe como juro do que pediste em nome da cidade.',
  },
  soul_scarred_by_seal: {
    name: 'Alma cicatriz do selo',
    description:
      'O selo partiu mal; a alma ficou com a costura à mostra. Quem luta contigo nota o eco que não fecha.',
  },
  title_fallen_god: {
    name: 'Título: deus caído',
    description:
      'Testemunhaste ou consumiste o título que o cume nega; nome que pesa como coroa de pedra negra — glória e maldição à vez.',
  },
  tomas_camp_oath: {
    name: 'Juramento com o Tomás',
    description:
      'Ao lume do acampamento, o escudeiro amarrou palavra contigo; dever mútuo que cheira a ferro e pão partido.',
  },
  tomas_void_duty: {
    name: 'Dever no vazio',
    description:
      'No deserto final, o Tomás nomeou obrigação sem fanfarra; carregas dever que não pede aplauso, só cumprimento.',
  },
  vetrnax_slain: {
    name: 'Vetrnax findado',
    description:
      'O gelo perdeu o seu titã; a cordilheira lembra quem fechou o nome na neve com lâmina ou ritual.',
  },
  wound_mire_leg: {
    name: 'Mordida do poço',
    description:
      'A sorte falhou no charco; a perna lembra dentes que não são teus — leme que tarda um segundo quando o perigo exige dois.',
  },
};
