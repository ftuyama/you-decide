import type { DialogueEnemyDef } from '../../../../engine/schema/index.ts';
import * as Spr from '../../ascii/sprites/enemies/index.ts';

export const act1_mirror_twin: DialogueEnemyDef = {
  id: 'act1_mirror_twin',
  name: 'O outro no bronze',
  sprite: Spr.act1_mirror_twin.sprite,
  tensionMax: 13,
  lootDrops: [
    { chance: 0.22, resource: 'gold', amount: 2 },
    { chance: 0.08, itemId: 'potion_hp' },
  ],
  graph: {
    rootNodeId: 'root',
    nodes: {
      root: {
        linePt:
          'O bronze nos batentes não reflete: recolhe. Junta-te a ti num ângulo que não escolheste — armadura e capa parecem emprestadas a quem ensaiou o teu gesto antes de ti. O corredor respira por duas bocas ao mesmo tempo. O metal não pergunta “quem és”; pergunta “quanto de ti ainda é teu se eu te devolver o resto”.',
        choices: [
          {
            textPt:
              'Nomear em silêncio o medo mais pequeno — não o herói que queres ser, o hábito feio que conheces de cor.',
            resolution: {
              kind: 'skill',
              attr: 'mind',
              tn: 8,
              successNodeId: 'b_mind_ok',
              failNodeId: 'b_mind_fail',
            },
            effectsOnSuccess: { enemyHpDelta: -2 },
            effectsOnFailure: { playerHpLossPercent: 5, enemyHpDelta: 2 },
          },
          {
            textPt:
              'Aproximar-te como quem entra em água fria: devagar, sem discurso, deixando o som dos passos dizer “ainda estou aqui”.',
            resolution: { kind: 'fixed', nextNodeId: 'b_soft' },
            effects: { enemyHpDelta: -2 },
          },
          {
            textPt:
              'Deixar o acaso decidir se o reflexo merece uma trégua ou uma lição — atirar a pergunta ao escuro e ouvir o que volta.',
            resolution: {
              kind: 'luck',
              tn: 8,
              luckPenalty: 0,
              successNodeId: 'b_luck_ok',
              failNodeId: 'b_luck_fail',
            },
            effectsOnSuccess: { enemyHpDelta: -2 },
            effectsOnFailure: { playerHpLossPercent: 6, enemyHpDelta: 2 },
          },
          {
            textPt:
              'Empurrar para o espelho o que te pesa — vergonha, pressa, culpa — e exigir que ele carregue sozinho, ainda que isso rasgue.',
            resolution: { kind: 'fixed', nextNodeId: 'b_blunt' },
            effects: { playerHpLossPercent: 7, enemyHpDelta: 2 },
          },
        ],
      },

      b_mind_ok: {
        linePt:
          'A palavra certa não brilha: encaixa. O bronze hesita como quem perdeu o guião; por um instante, o reflexo não sabe se deve copiar ou corrigir.',
        choices: [
          {
            textPt:
              'Não pedir aplausos ao espelho; pedir silêncio — o tipo de silêncio que não vende postais.',
            resolution: { kind: 'fixed', nextNodeId: 'c_m_ok_a' },
            effects: { enemyHpDelta: -3 },
          },
          {
            textPt:
              'Confessar um pormenor ridículo (um tic, um cheiro, um medo de barata) para provar que a tua humanidade não cabe num slogan.',
            resolution: { kind: 'fixed', nextNodeId: 'c_m_ok_b' },
            effects: { enemyHpDelta: -2 },
          },
          {
            textPt:
              'Testar se consegues desviar o olhar sem fugir — aguentar o brilho até ele perder graça.',
            resolution: {
              kind: 'skill',
              attr: 'agi',
              tn: 8,
              successNodeId: 'c_m_ok_c',
              failNodeId: 'c_m_ok_c_fail',
            },
            effectsOnSuccess: { enemyHpDelta: -2 },
            effectsOnFailure: { playerHpLossPercent: 5, enemyHpDelta: 1 },
          },
        ],
      },
      b_mind_fail: {
        linePt:
          'A frase escorrega. O metal agradece: adora quando tentas ser profundo e sais pretensioso. O reflexo devolve-te uma versão mais limpa — e por isso mais falsa — do que disseste.',
        choices: [
          {
            textPt:
              'Aceitar o tropeço; rir por dentro, seco, e voltar à coisa concreta: respiração, peso dos pés, frio na nuca.',
            resolution: { kind: 'fixed', nextNodeId: 'c_m_fail_a' },
            effects: { playerHpLossPercent: 4, enemyHpDelta: -1 },
          },
          {
            textPt:
              'Apertar a mandíbula e insistir na mesma linha — “não, eu sei o que quis dizer” — sabendo que insistência aqui é combustível.',
            resolution: { kind: 'fixed', nextNodeId: 'c_m_fail_b' },
            effects: { playerHpLossPercent: 8, enemyHpDelta: 3 },
          },
          {
            textPt:
              'Pedir ao corpo uma saída de emergência: força bruta de presença, como quem empurra uma porta emperrada.',
            resolution: {
              kind: 'skill',
              attr: 'str',
              tn: 9,
              successNodeId: 'c_m_fail_c_ok',
              failNodeId: 'c_m_fail_c_bad',
            },
            effectsOnSuccess: { enemyHpDelta: -4 },
            effectsOnFailure: { playerHpLossPercent: 8, enemyHpDelta: 2 },
          },
        ],
      },

      b_soft: {
        linePt:
          'No limiar, o frio sobe-te pela nuca. O espelho assume que já lá estavas, só virado ao contrário. Por um instante, duas sombras discutem qual nasceu primeiro — e nenhuma quer perder.',
        choices: [
          {
            textPt:
              'Esvaziar o peito devagar, sem teatro, até o reflexo não ter frase pronta para roubar.',
            resolution: { kind: 'fixed', nextNodeId: 'c_soft_a' },
            effects: { enemyHpDelta: -3 },
          },
          {
            textPt:
              'Desafiar o bronze com o olhar até arder — “prova que não sou eu” — sem abrir a boca.',
            resolution: { kind: 'fixed', nextNodeId: 'c_soft_b' },
            effects: { enemyHpDelta: 2 },
          },
          {
            textPt:
              'Deixar a sorte escolher se o silêncio te protege ou se o corredor te expõe de lado.',
            resolution: {
              kind: 'luck',
              tn: 7,
              luckPenalty: 0,
              successNodeId: 'c_soft_c_ok',
              failNodeId: 'c_soft_c_fail',
            },
            effectsOnSuccess: { enemyHpDelta: -2 },
            effectsOnFailure: { playerHpLossPercent: 4, enemyHpDelta: 2 },
          },
        ],
      },

      b_luck_ok: {
        linePt:
          'Algo no ar desalinha a cópia. O reflexo ainda tenta acompanhar-te, mas chega atrasado: riso que não combinava, gesto que não ensaiaste — e mesmo assim foi teu.',
        choices: [
          {
            textPt:
              'Aproveitar o desalinhamento: falar baixo, quase trivial, para que o metal não tenha eco heroico.',
            resolution: { kind: 'fixed', nextNodeId: 'c_l_ok_a' },
            effects: { enemyHpDelta: -3 },
          },
          {
            textPt:
              'Exigir prova física: tocar o batente com a palma da mão e sentir se o mundo “real” responde primeiro.',
            resolution: {
              kind: 'skill',
              attr: 'str',
              tn: 8,
              successNodeId: 'c_l_ok_b_ok',
              failNodeId: 'c_l_ok_b_fail',
            },
            effectsOnSuccess: { enemyHpDelta: -3 },
            effectsOnFailure: { playerHpLossPercent: 7, enemyHpDelta: 1 },
          },
          {
            textPt:
              'Virar as costas meio segundo ao reflexo — não por desprezo, por confiança maldosa no teu próprio eixo.',
            resolution: { kind: 'fixed', nextNodeId: 'c_l_ok_c' },
            effects: { enemyHpDelta: -2 },
          },
        ],
      },
      b_luck_fail: {
        linePt:
          'O acaso escolhe o pior eco. O espelho devolve uma risada que não é tua e, mesmo assim, soa convincente. Por um segundo, acreditas — e esse segundo é buraco.',
        choices: [
          {
            textPt:
              'Soltar o orgulho e voltar ao básico: um facto simples, sem adorno, que nem o bronze consiga torcer.',
            resolution: {
              kind: 'skill',
              attr: 'mind',
              tn: 9,
              successNodeId: 'c_l_fail_a_ok',
              failNodeId: 'c_l_fail_a_bad',
            },
            effectsOnSuccess: { enemyHpDelta: -3 },
            effectsOnFailure: { playerHpLossPercent: 8, enemyHpDelta: 2 },
          },
          {
            textPt:
              'Correr o risco de novo — pedir outra moeda ao poço, mesmo com a mão a tremer.',
            resolution: {
              kind: 'luck',
              tn: 9,
              luckPenalty: 1,
              successNodeId: 'c_l_fail_b_ok',
              failNodeId: 'c_l_fail_b_bad',
            },
            effectsOnSuccess: { enemyHpDelta: -2 },
            effectsOnFailure: { playerHpLossPercent: 10, enemyHpDelta: 3 },
          },
          {
            textPt:
              'Aguentar o choque sem fingir coragem: deixar o corpo tremer e mesmo assim não dar palavra afiada.',
            resolution: { kind: 'fixed', nextNodeId: 'c_l_fail_c' },
            effects: { playerHpLossPercent: 10 },
          },
        ],
      },

      b_blunt: {
        linePt:
          'O espelho não recua: espelha a tua dureza e acrescenta a dela. O verde do bronze espessa; vês dois rostos a discutir quem começou — e percebes que acusação é munição que tu entregaste.',
        choices: [
          {
            textPt:
              'Baixar as armas verbais antes que o metal as devore — reconhecer o tom partido.',
            resolution: { kind: 'fixed', nextNodeId: 'c_bl_a' },
            effects: { enemyHpDelta: -2 },
          },
          {
            textPt:
              'Responder fogo com fogo, exigindo prova, sabendo que isso alimenta o reflexo.',
            resolution: { kind: 'fixed', nextNodeId: 'c_bl_b' },
            effects: { playerHpLossPercent: 6, enemyHpDelta: 3 },
          },
          {
            textPt:
              'Tentar partir a tensão com o corpo: avanço curto, firme, como quem ocupa terreno sem gritar.',
            resolution: {
              kind: 'skill',
              attr: 'str',
              tn: 9,
              successNodeId: 'c_bl_c_ok',
              failNodeId: 'c_bl_c_bad',
            },
            effectsOnSuccess: { enemyHpDelta: -3 },
            effectsOnFailure: { playerHpLossPercent: 6, enemyHpDelta: 2 },
          },
        ],
      },

      c_m_ok_a: {
        linePt:
          'O silêncio que pediste não é bonito: é útil. O reflexo fica sem reverberação e, por um instante, parece… sobrar demasiado espaço.',
        choices: [
          {
            textPt: 'Atravessar esse espaço sem olhar para trás.',
            resolution: { kind: 'fixed', nextNodeId: 'd_truce_space' },
            effects: { enemyHpDelta: -1 },
          },
          {
            textPt:
              'Deixar uma promessa mínima ao espelho: “não te uso para me punir hoje” — e cumpri-la só com postura.',
            resolution: { kind: 'fixed', nextNodeId: 'd_truce_oath' },
            effects: { enemyHpDelta: -1 },
          },
        ],
      },
      d_truce_space: {
        linePt:
          'No meio do espaço novo, o corredor parece mais alto e o bronze mais baixo — como se a distância tivesse mudado de dono. Ainda assim, o reflexo tenta colar-se ao teu ângulo de fuga.',
        choices: [
          {
            textPt:
              'Parar, ouvir a pedra antes do metal — deixar o corredor falar baixo o suficiente para o espelho perder o costume da tua voz.',
            resolution: { kind: 'fixed', nextNodeId: 'h_armistice' },
            effects: { enemyHpDelta: -2 },
          },
          {
            textPt:
              'Atravessar de rompante: não dar tempo ao bronze de ensaiar a segunda frase.',
            resolution: { kind: 'fixed', nextNodeId: 'gate_release' },
            effects: { enemyHpDelta: -4 },
          },
          {
            textPt:
              'Medir o passo com agilidade de quem foge a cordas invisíveis — sem correr, sem tropeçar no próprio medo.',
            resolution: {
              kind: 'skill',
              attr: 'agi',
              tn: 8,
              successNodeId: 'd_truce_space_agile',
              failNodeId: 'h_armistice',
            },
            effectsOnSuccess: { enemyHpDelta: -3 },
            effectsOnFailure: { enemyHpDelta: -1 },
          },
        ],
      },
      d_truce_space_agile: {
        linePt:
          'O passo encaixa; o reflexo chega atrasado por um compasso. Por um instante, o corredor parece teu aliado mesquinho — só sombra e rangido, nada de teatro.',
        choices: [
          {
            textPt: 'Não mitificar o instante: aproveitar e calar antes que o mito renasca.',
            resolution: { kind: 'fixed', nextNodeId: 'gate_release' },
            effects: { enemyHpDelta: -3 },
          },
          {
            textPt:
              'Permitir-te olhar uma vez — só uma — para confirmar que o espelho ainda está a tentar alcançar-te.',
            resolution: { kind: 'fixed', nextNodeId: 'h_armistice' },
            effects: { enemyHpDelta: -2 },
          },
        ],
      },
      d_truce_oath: {
        linePt:
          'A promessa mínima pesa como anel apertado: pequena, real. O bronze quer transformá-la em juramento épico — porque epicidade aqui é armadilha.',
        choices: [
          {
            textPt:
              'Dizer a promessa ao batente de madeira, ao chão, ao ar — a qualquer coisa que não peça aplausos.',
            resolution: { kind: 'fixed', nextNodeId: 'h_armistice' },
            effects: { enemyHpDelta: -2 },
          },
          {
            textPt:
              'Cumprir postura de frente para o reflexo: olhos nele, corpo fechado em promessa silenciosa.',
            resolution: { kind: 'fixed', nextNodeId: 'gate_release' },
            effects: { enemyHpDelta: -3 },
          },
          {
            textPt:
              'Testar se a tua mente aguenta o tom sem escorregar para teatro.',
            resolution: {
              kind: 'skill',
              attr: 'mind',
              tn: 8,
              successNodeId: 'gate_release',
              failNodeId: 'h_armistice',
            },
            effectsOnSuccess: { enemyHpDelta: -3 },
            effectsOnFailure: { enemyHpDelta: -1 },
          },
        ],
      },
      h_armistice: {
        linePt:
          'Rotas diferentes, mesmo limiar: o bronze baixa o volume como quem finalmente percebe que o teu silêncio não é falta de argumento — é recusa em emprestar-te o guião. Ainda assim, exige uma última escolha.',
        choices: [
          {
            textPt:
              'Fechar em trégua quieta — sem música, sem pose — só espaço que respiras sem réplica.',
            resolution: { kind: 'fixed', nextNodeId: 'gate_release' },
            effects: { enemyHpDelta: -3 },
          },
          {
            textPt:
              'Fechar em promessa mínima cumprida: não bonita, mas tua — e o espelho fica com a vergonha dele.',
            resolution: { kind: 'fixed', nextNodeId: 'gate_release' },
            effects: { enemyHpDelta: -2 },
          },
          {
            textPt:
              'Escolher a verdade pequena, feia, de cozinha — a que não impressiona ninguém e por isso não mente.',
            resolution: { kind: 'fixed', nextNodeId: 'gate_release' },
            effects: { enemyHpDelta: -4 },
          },
          {
            textPt:
              'Deixar um suspiro feio subir ao corredor antes que o metal o roube e o torne “bonito”.',
            resolution: { kind: 'fixed', nextNodeId: 'gate_release' },
            effects: { enemyHpDelta: -3 },
          },
        ],
      },
      c_m_ok_b: {
        linePt:
          'O pormenor ridículo fica mais real que qualquer discurso. O bronze tenta ironizar e engasga-se: não há graça limpa quando a vergonha tem nome de cozinha.',
        choices: [
          {
            textPt: 'Fechar o assunto com um aceno seco — sem vitória bonita, com vitória tua.',
            resolution: { kind: 'fixed', nextNodeId: 'h_armistice' },
            effects: { enemyHpDelta: -2 },
          },
          {
            textPt:
              'Permitir-te um suspiro feio, honesto, que o corredor ouça antes do metal.',
            resolution: { kind: 'fixed', nextNodeId: 'h_armistice' },
            effects: { enemyHpDelta: -2 },
          },
        ],
      },
      c_m_ok_c: {
        linePt:
          'O brilho perde graça quando não o alimentas com medo. O reflexo ainda está lá, mas já não manda no ritmo da tua pupila.',
        choices: [
          {
            textPt: 'Seguir em frente como quem sabe onde pisa.',
            resolution: { kind: 'fixed', nextNodeId: 'd_steady_prep' },
            effects: { enemyHpDelta: -1 },
          },
          {
            textPt:
              'Guardar este truque para ti: olhar “morto” que desarma espelhos famintos.',
            resolution: { kind: 'fixed', nextNodeId: 'd_steady_prep' },
            effects: { enemyHpDelta: -1 },
          },
        ],
      },
      d_steady_prep: {
        linePt:
          'Antes de creres que já ganhaste o olhar, o corredor pede uma confirmação mesquinha: um som real — rangido, respiração tua, qualquer coisa que não seja eco do bronze.',
        choices: [
          {
            textPt:
              'Dar ao corpo o comando: ombros largos, queixo neutro, olhar que não alimenta o teatro.',
            resolution: { kind: 'fixed', nextNodeId: 'linger_steady' },
            effects: { enemyHpDelta: -4 },
          },
          {
            textPt:
              'Guardar o truque como segredo operacional — não exibir frieza, usá-la.',
            resolution: { kind: 'fixed', nextNodeId: 'linger_steady' },
            effects: { enemyHpDelta: -3 },
          },
          {
            textPt:
              'Deixar o espelho tentar copiar o teu “olhar morto” e rir por dentro quando ele exagera.',
            resolution: { kind: 'fixed', nextNodeId: 'h_armistice' },
            effects: { enemyHpDelta: -2 },
          },
        ],
      },
      c_m_ok_c_fail: {
        linePt:
          'O olhar escapa-te na hora H. O metal lambe a falha e devolve uma lágrima que não pediste — convincente até demais.',
        choices: [
          {
            textPt: 'Aceitar o corte e seguir mesmo assim — sem negociar com o teatro.',
            resolution: { kind: 'fixed', nextNodeId: 'h_winter_edge' },
          },
          {
            textPt:
              'Repor distância fisicamente: um passo atrás, ombros baixos, ar que não alimenta o incêndio.',
            resolution: { kind: 'fixed', nextNodeId: 'h_winter_edge' },
          },
        ],
      },

      c_m_fail_a: {
        linePt:
          'O tropeço fica no ar como cheiro a queimado. Ainda assim, o corpo lembra-te coisas que o discurso esqueceu: peso, chão, respiração.',
        choices: [
          {
            textPt: 'Deixar o erro ficar pequeno onde está.',
            resolution: { kind: 'fixed', nextNodeId: 'gate_release' },
            effects: { enemyHpDelta: -3 },
          },
          {
            textPt:
              'Transformar o tropeço em piada seca — arriscar o espelho rir contigo e não de ti.',
            resolution: {
              kind: 'luck',
              tn: 8,
              luckPenalty: 0,
              successNodeId: 'gate_release',
              failNodeId: 'gate_release',
            },
            effectsOnSuccess: { enemyHpDelta: -4 },
            effectsOnFailure: { playerHpLossPercent: 6, enemyHpDelta: -2 },
          },
        ],
      },
      c_m_fail_b: {
        linePt:
          'A insistência acende o bronze. Agora o reflexo fala por ti em frases perfeitas — e cada uma é uma facada de cortesia.',
        choices: [
          {
            textPt:
              'Cortar o fio: calar de vez, mesmo com a garganta a pedir justiça.',
            resolution: { kind: 'fixed', nextNodeId: 'h_winter_edge' },
          },
          {
            textPt:
              'Pagar o preço do teatro e empurrar até o fim — sangrar para ver se o espelho sangra também.',
            resolution: { kind: 'fixed', nextNodeId: 'h_winter_edge' },
          },
        ],
      },
      h_winter_edge: {
        linePt:
          'Chegas ao mesmo sítio quente por caminhos diferentes: o bronze aperta onde a pele ainda acredita que pode fingir que não sente. Aqui, hostilidade e vergonha trocam de lugar — e o corredor pede que escolhas como sais da borda, não como entras no mito.',
        choices: [
          {
            textPt:
              'Aceitar o corte moral e seguir sem negociar com o teatro do reflexo.',
            resolution: { kind: 'fixed', nextNodeId: 'linger_winter' },
            effects: { playerHpLossPercent: 9, enemyHpDelta: -3 },
          },
          {
            textPt:
              'Repor distância no corpo: um passo atrás, ombros baixos, ar que não alimenta o incêndio.',
            resolution: { kind: 'fixed', nextNodeId: 'gate_release' },
            effects: { playerHpLossPercent: 5, enemyHpDelta: -2 },
          },
          {
            textPt:
              'Calar de vez, mesmo com a garganta a pedir justiça — deixar o silêncio ser faca.',
            resolution: { kind: 'fixed', nextNodeId: 'linger_winter' },
            effects: { playerHpLossPercent: 12, enemyHpDelta: -4 },
          },
          {
            textPt:
              'Empurrar o teatro até ao fim — sangrar para ver se o espelho sangra também.',
            resolution: { kind: 'fixed', nextNodeId: 'linger_winter' },
            effects: { playerHpLossPercent: 18, enemyHpDelta: -7 },
          },
        ],
      },
      c_m_fail_c_ok: {
        linePt:
          'A porta cede ao ombro — não por violência gloriosa, por teimosia física honesta. O reflexo perde um instante de sincronia e, nesse instante, tu existes inteiro.',
        choices: [
          {
            textPt: 'Passar enquanto a fresta ainda respira.',
            resolution: { kind: 'fixed', nextNodeId: 'linger_shoulder' },
            effects: { enemyHpDelta: -6 },
          },
          {
            textPt:
              'Não celebrar; só ocupar o espaço como quem sabe que empurrões também cansam.',
            resolution: { kind: 'fixed', nextNodeId: 'linger_shoulder' },
            effects: { enemyHpDelta: -5 },
          },
        ],
      },
      c_m_fail_c_bad: {
        linePt:
          'O ombro encontra pedra com pele de metal. O corredor ri por ti, baixinho. O reflexo agradece a lição de impaciência.',
        choices: [
          {
            textPt:
              'Aceitar o hematoma moral e seguir — vitória feia, mas vitória.',
            resolution: { kind: 'fixed', nextNodeId: 'gate_toll' },
            effects: { playerHpLossPercent: 14, enemyHpDelta: -5 },
          },
          {
            textPt:
              'Recuar e pagar o preço do espetáculo — sangrar, mas tirar ao espelho a última gargalhada.',
            resolution: { kind: 'fixed', nextNodeId: 'gate_toll' },
            effects: { playerHpLossPercent: 20, enemyHpDelta: -8 },
          },
        ],
      },

      c_soft_a: {
        linePt:
          'O silêncio aprende a tua forma. O bronze deixa de vibrar com frases prontas e passa a escutar pausas — essas, sim, tuas.',
        choices: [
          {
            textPt:
              'Escolher a verdade pequena: o pormenor feio que não impressiona ninguém, mas não mente.',
            resolution: {
              kind: 'skill',
              attr: 'mind',
              tn: 7,
              successNodeId: 'c_soft_a_ok',
              failNodeId: 'c_soft_a_fail',
            },
            effectsOnSuccess: { enemyHpDelta: -3 },
            effectsOnFailure: { playerHpLossPercent: 5, enemyHpDelta: 1 },
          },
          {
            textPt:
              'Endurecer por dentro “para não ceder” — e sentir o metal agradecer-te a armadura invisível.',
            resolution: { kind: 'fixed', nextNodeId: 'c_soft_a_hard' },
            effects: { enemyHpDelta: 2 },
          },
          {
            textPt:
              'Convidar o reflexo a copiar o teu cansaço em vez do teu discurso — deixar as pálpebras pesadas falarem.',
            resolution: { kind: 'fixed', nextNodeId: 'c_soft_a_tired' },
            effects: { enemyHpDelta: -2 },
          },
        ],
      },
      c_soft_a_ok: {
        linePt:
          'A verdade pequena encaixa. O espelho não tem como a alargar em lenda sem partir.',
        choices: [
          {
            textPt: 'Encerrar com a mesma simplicidade com que começaste.',
            resolution: { kind: 'fixed', nextNodeId: 'd_soft_merge' },
          },
          {
            textPt:
              'Oferecer ao bronze uma segunda pequena verdade — talvez cruel contigo, justa com o mundo.',
            resolution: { kind: 'fixed', nextNodeId: 'd_soft_merge' },
          },
        ],
      },
      d_soft_merge: {
        linePt:
          'O corredor parece alargar um dedo: ainda há duas maneiras de saíres dali sem te tornares monumento — e ambas exigem que continues pequeno o suficiente para seres real.',
        choices: [
          {
            textPt:
              'Fechar com um aceno seco — sem vitória bonita, com vitória tua.',
            resolution: { kind: 'fixed', nextNodeId: 'gate_release' },
            effects: { enemyHpDelta: -4 },
          },
          {
            textPt:
              'Permitir-te o suspiro feio e seguir — sem segunda peça de teatro.',
            resolution: { kind: 'fixed', nextNodeId: 'gate_release' },
            effects: { enemyHpDelta: -5 },
          },
          {
            textPt:
              'Ouvir o corredor pedir trégua por ti — e deixar a palavra certa nascer no silêncio, não no bronze.',
            resolution: { kind: 'fixed', nextNodeId: 'h_armistice' },
            effects: { enemyHpDelta: -2 },
          },
        ],
      },
      c_soft_a_fail: {
        linePt:
          'A verdade pequena sai torta na boca e vira confissão dramática. O metal adora drama — bebe-o sem sede.',
        choices: [
          {
            textPt: 'Parar de falar até o drama morrer de fome.',
            resolution: { kind: 'fixed', nextNodeId: 'gate_release' },
            effects: { playerHpLossPercent: 6, enemyHpDelta: -3 },
          },
          {
            textPt:
              'Aceitar o ridículo e seguir — com a pele a arder de vergonha, mas com os pés a avançar.',
            resolution: { kind: 'fixed', nextNodeId: 'gate_toll' },
            effects: { playerHpLossPercent: 9, enemyHpDelta: -4 },
          },
        ],
      },
      c_soft_a_hard: {
        linePt:
          'A dureza devolve dureza. O reflexo ganha bordas; o teu rosto duplica-se em camadas que se julgam umas às outras.',
        choices: [
          {
            textPt:
              'Dissolver a postura: ombros, mandíbula, mentira de “estou bem”.',
            resolution: { kind: 'fixed', nextNodeId: 'gate_toll' },
            effects: { playerHpLossPercent: 5, enemyHpDelta: -2 },
          },
          {
            textPt:
              'Manter a couraça e pagar o preço — ver se o metal cansa antes de ti.',
            resolution: { kind: 'fixed', nextNodeId: 'gate_toll' },
            effects: { playerHpLossPercent: 11, enemyHpDelta: -3 },
          },
        ],
      },
      c_soft_a_tired: {
        linePt:
          'O cansaço não é espetáculo; é biologia. O espelho tenta transformá-lo em derrota e falha — porque cansaço também é humano demais para mito.',
        choices: [
          {
            textPt: 'Deixar o cansaço ficar contigo sem vergonha.',
            resolution: { kind: 'fixed', nextNodeId: 'linger_fatigue' },
            effects: { enemyHpDelta: -4 },
          },
          {
            textPt:
              'Usar o cansaço como escudo: “não tenho energia para a tua performance”.',
            resolution: { kind: 'fixed', nextNodeId: 'linger_fatigue' },
            effects: { enemyHpDelta: -5 },
          },
        ],
      },

      c_soft_b: {
        linePt:
          'O olhar ardente alimenta o bronze. O reflexo sorri com a tua boca e soma-lhe um segundo sorriso — o que não pediste.',
        choices: [
          {
            textPt:
              'Apagar o fogo no olhar: frio controlado, quase rude, sem hostilidade de palco.',
            resolution: {
              kind: 'skill',
              attr: 'mind',
              tn: 8,
              successNodeId: 'c_soft_b_ok',
              failNodeId: 'c_soft_b_fail',
            },
            effectsOnSuccess: { enemyHpDelta: -3 },
            effectsOnFailure: { playerHpLossPercent: 6, enemyHpDelta: 2 },
          },
          {
            textPt:
              'Manter o desafio e pagar o calor — suor, tontura, a sensação de estares a negociar com chama.',
            resolution: { kind: 'fixed', nextNodeId: 'c_soft_b_burn' },
            effects: { playerHpLossPercent: 10, enemyHpDelta: 1 },
          },
          {
            textPt:
              'Deslocar o duelo para o ironismo mínimo — um detalhe absurdo que desmonte a pose heroica sem te transformares em palhaço.',
            resolution: { kind: 'fixed', nextNodeId: 'c_soft_b_wry' },
            effects: { enemyHpDelta: -1 },
          },
        ],
      },
      c_soft_b_wry: {
        linePt:
          'O absurdo pequeno fica mais afiado que a bravura. O espelho tenta copiar o teu humor e atras-se meia batida — o suficiente para a cópia parecer doente.',
        choices: [
          {
            textPt:
              'Fechar com um último pormenor ridículo e calar — deixar o riso morrer na garganta, não no metal.',
            resolution: { kind: 'fixed', nextNodeId: 'linger_irony' },
            effects: { enemyHpDelta: -4 },
          },
          {
            textPt:
              'Deixar o riso sair — baixo, feio, humano — e ver se o bronze sabe engolir som que não ensaiou.',
            resolution: { kind: 'fixed', nextNodeId: 'linger_irony' },
            effects: { enemyHpDelta: -3 },
          },
        ],
      },
      c_soft_b_ok: {
        linePt:
          'O calor baixa sem humilhação. O espelho procura outra emoção para roubar e não encontra — só atenção seca, quase clínica.',
        choices: [
          {
            textPt: 'Fechar o confronto com essa clínica fria.',
            resolution: { kind: 'fixed', nextNodeId: 'gate_release' },
            effects: { enemyHpDelta: -4 },
          },
          {
            textPt:
              'Virar costas ao reflexo por três passos — tempo suficiente para o mito morrer de sede.',
            resolution: { kind: 'fixed', nextNodeId: 'gate_release' },
            effects: { enemyHpDelta: -3 },
          },
        ],
      },
      c_soft_b_fail: {
        linePt:
          'Tentas apagar o fogo e acendes cinismo. O metal adora cinismo: é açúcar para espelhos.',
        choices: [
          {
            textPt: 'Sair do cinismo à força — voltar ao corpo, à tolice honesta.',
            resolution: { kind: 'fixed', nextNodeId: 'gate_toll' },
            effects: { playerHpLossPercent: 8, enemyHpDelta: -3 },
          },
          {
            textPt:
              'Aceitar o preço e seguir com o cinismo como cicatriz visível.',
            resolution: { kind: 'fixed', nextNodeId: 'gate_toll' },
            effects: { playerHpLossPercent: 13, enemyHpDelta: -5 },
          },
        ],
      },
      c_soft_b_burn: {
        linePt:
          'O calor torna-se húmidos e barulho dentro da cabeça. O reflexo dança na tua vertigem — e por um instante quase te convence que gostas disso.',
        choices: [
          {
            textPt: 'Cortar o trance com dor física mínima — morder a língua, agarrar o cinto, ancorar.',
            resolution: { kind: 'fixed', nextNodeId: 'd_burn_stall' },
          },
          {
            textPt:
              'Deixar arder até o fim e arrancar vitória dos restos — caro, mas teu.',
            resolution: { kind: 'fixed', nextNodeId: 'd_burn_stall' },
          },
        ],
      },
      d_burn_stall: {
        linePt:
          'No meio do calor, o corredor oferece um instante de “real” — rangido, frio na pedra — como se quisesse lembrar-te que o fogo também cansa se não lhe deres palha.',
        choices: [
          {
            textPt:
              'Ancorar no corpo: morder a língua, agarrar o cinto, existir fora do monólogo.',
            resolution: { kind: 'fixed', nextNodeId: 'h_burn_merge' },
            effects: { playerHpLossPercent: 4, enemyHpDelta: -1 },
          },
          {
            textPt:
              'Empurrar o fogo até ao limite e ver o que resta quando a chama não tem público.',
            resolution: { kind: 'fixed', nextNodeId: 'h_burn_merge' },
            effects: { enemyHpDelta: -2 },
          },
        ],
      },
      h_burn_merge: {
        linePt:
          'Fogo com fogo deixa o bronze espelhado em cinzas verdes. Chegas aqui por vertigem ou por confronto — o resultado cheira igual a metal quente e orgulho mal dormido.',
        choices: [
          {
            textPt:
              'Ancorar no corpo quando o calor verbal vira vertigem — morder a língua, agarrar o cinto.',
            resolution: { kind: 'fixed', nextNodeId: 'linger_burn' },
            effects: { playerHpLossPercent: 8, enemyHpDelta: -3 },
          },
          {
            textPt:
              'Deixar arder até ao fim e arrancar vitória dos restos — colisão, não pose.',
            resolution: { kind: 'fixed', nextNodeId: 'linger_burn' },
            effects: { playerHpLossPercent: 12, enemyHpDelta: -5 },
          },
          {
            textPt:
              'Engolir o orgulho e procurar a beira do silêncio antes que ele te procure com dentes.',
            resolution: { kind: 'fixed', nextNodeId: 'linger_burn' },
            effects: { playerHpLossPercent: 8, enemyHpDelta: -4 },
          },
          {
            textPt:
              'Manter o ritmo da provocação até ao fim — colisão, não teatro.',
            resolution: { kind: 'fixed', nextNodeId: 'linger_burn' },
            effects: { playerHpLossPercent: 18, enemyHpDelta: -8 },
          },
        ],
      },

      c_soft_c_ok: {
        linePt:
          'O corredor escolhe o teu lado por acidente — sombra na pedra, rangido longe do bronze. O espelho hesita como quem perdeu o compasso.',
        choices: [
          {
            textPt: 'Seguir o acidente como bússola.',
            resolution: { kind: 'fixed', nextNodeId: 'h_calm_echo' },
          },
          {
            textPt:
              'Não mitificar o acaso — só agradecer em silêncio e andar.',
            resolution: { kind: 'fixed', nextNodeId: 'h_calm_echo' },
          },
        ],
      },
      h_calm_echo: {
        linePt:
          'O mesmo sossego chega por rotas diferentes: o bronze baixa o volume e o corredor parece lembrar que existem sons que não nascem do metal. Ainda assim, falta escolher como fechas o capítulo sem lenda.',
        choices: [
          {
            textPt:
              'Seguir o acidente como bússola — deixar o anti-mito respirar.',
            resolution: { kind: 'fixed', nextNodeId: 'gate_release' },
            effects: { enemyHpDelta: -4 },
          },
          {
            textPt:
              'Agradecer em silêncio e andar — sem romance, sem pedestal.',
            resolution: { kind: 'fixed', nextNodeId: 'gate_release' },
            effects: { enemyHpDelta: -3 },
          },
          {
            textPt:
              'Rir por dentro sem oferecer som ao metal — deixar o corpo roubar a última linha.',
            resolution: { kind: 'fixed', nextNodeId: 'gate_release' },
            effects: { enemyHpDelta: -4 },
          },
          {
            textPt:
              'Acelerar o passo só o suficiente para quebrar a sincronia com o reflexo.',
            resolution: { kind: 'fixed', nextNodeId: 'gate_release' },
            effects: { enemyHpDelta: -5 },
          },
        ],
      },
      c_soft_c_fail: {
        linePt:
          'O corredor entrega-te ao bronze outra vez. O acaso ri com dentes de metal; a tua sombra tropeça na dele.',
        choices: [
          {
            textPt:
              'Rolar os dados do corpo: agilidade para não ser puxado para a cópia.',
            resolution: {
              kind: 'skill',
              attr: 'agi',
              tn: 9,
              successNodeId: 'gate_toll',
              failNodeId: 'gate_toll',
            },
            effectsOnSuccess: { enemyHpDelta: -5 },
            effectsOnFailure: { playerHpLossPercent: 8, enemyHpDelta: 1 },
          },
          {
            textPt:
              'Recusar jogos: aguentar o desalinhamento sem gracejo — peito aberto, sem proposta, até o espelho se fartar de te copiar parado.',
            resolution: { kind: 'fixed', nextNodeId: 'gate_release' },
            effects: { playerHpLossPercent: 8, enemyHpDelta: -4 },
          },
          {
            textPt:
              'Negociar com o ar — palavras ditas ao corredor, não ao bronze — para ver se o mundo “real” te reconhece primeiro.',
            resolution: {
              kind: 'skill',
              attr: 'mind',
              tn: 8,
              successNodeId: 'gate_release',
              failNodeId: 'gate_release',
            },
            effectsOnSuccess: { enemyHpDelta: -4 },
            effectsOnFailure: { playerHpLossPercent: 7, enemyHpDelta: 2 },
          },
        ],
      },

      c_l_ok_a: {
        linePt:
          'A trivialidade desarma o mito. O reflexo tenta elevar a fala a monumento e falha — não há pedestal para “hoje comi”.',
        choices: [
          {
            textPt: 'Terminar num murmúrio quase inaudível — vitória por anti-clímax.',
            resolution: { kind: 'fixed', nextNodeId: 'd_trivial_merge' },
          },
          {
            textPt:
              'Empurrar mais trivialidade até o espelho vomitar poesia e perder o timing.',
            resolution: { kind: 'fixed', nextNodeId: 'd_trivial_merge' },
          },
        ],
      },
      d_trivial_merge: {
        linePt:
          'No mesmo patamar de mesquinhez sagrada, o corredor sorri por ti: trivialidade venceu o pedestal. Falta só decidir se sais num sussurro ou numa avalanche controlada.',
        choices: [
          {
            textPt: 'Sair no sussurro — anti-clímax como espada.',
            resolution: { kind: 'fixed', nextNodeId: 'gate_release' },
            effects: { enemyHpDelta: -5 },
          },
          {
            textPt:
              'Sair na avalanche — trivialidade até o espelho perder o timing.',
            resolution: { kind: 'fixed', nextNodeId: 'gate_release' },
            effects: { enemyHpDelta: -6 },
          },
          {
            textPt:
              'Desviar para o hub do silêncio útil — ainda há espaço para outra fechadura sem teatro.',
            resolution: { kind: 'fixed', nextNodeId: 'h_armistice' },
            effects: { enemyHpDelta: -2 },
          },
        ],
      },
      c_l_ok_b_ok: {
        linePt:
          'A palma encontra madeira fria antes do mito. O mundo “real” responde com gratidão seca: ainda há bordas que não são espelho.',
        choices: [
          {
            textPt: 'Ficar com essa descoberta como talismã sem romance.',
            resolution: { kind: 'fixed', nextNodeId: 'gate_release' },
            effects: { enemyHpDelta: -5 },
          },
          {
            textPt:
              'Bater mais uma vez — marca ritmo, não teatro.',
            resolution: { kind: 'fixed', nextNodeId: 'gate_release' },
            effects: { enemyHpDelta: -4 },
          },
        ],
      },
      c_l_ok_b_fail: {
        linePt:
          'A mão encontra o batente e o metal devolve o choque como riso. O corpo lembra: aqui, “real” também morde.',
        choices: [
          {
            textPt: 'Aceitar a mordida e seguir com a palma dormente.',
            resolution: { kind: 'fixed', nextNodeId: 'gate_toll' },
            effects: { playerHpLossPercent: 8, enemyHpDelta: -3 },
          },
          {
            textPt:
              'Trocar de mão, de ângulo, de ombro — teimosia física feia e eficaz.',
            resolution: { kind: 'fixed', nextNodeId: 'gate_toll' },
            effects: { playerHpLossPercent: 5, enemyHpDelta: -2 },
          },
        ],
      },
      c_l_ok_c: {
        linePt:
          'Confiança no eixo é provocação certa. O reflexo tenta copiar a rotação dos ombros e chega atrasado — parece marioneta.',
        choices: [
          {
            textPt: 'Rir por dentro sem oferecer som ao metal.',
            resolution: { kind: 'fixed', nextNodeId: 'h_calm_echo' },
          },
          {
            textPt:
              'Acelerar o passo só o suficiente para quebrar a sincronia.',
            resolution: { kind: 'fixed', nextNodeId: 'h_calm_echo' },
          },
        ],
      },

      c_l_fail_a_ok: {
        linePt:
          'O facto simples corta como faca de cozinha: feio, eficiente. O espelho não consegue enfeitar sem mentir mais alto — e hesita.',
        choices: [
          {
            textPt: 'Fechar com esse facto como fecho de porta.',
            resolution: { kind: 'fixed', nextNodeId: 'gate_release' },
            effects: { enemyHpDelta: -5 },
          },
          {
            textPt:
              'Repetir o facto até o eco morrer de tédio.',
            resolution: { kind: 'fixed', nextNodeId: 'gate_release' },
            effects: { enemyHpDelta: -6 },
          },
        ],
      },
      c_l_fail_a_bad: {
        linePt:
          'Até o facto simples te foge à boca. O bronze agradece: adora quando a língua trava no básico.',
        choices: [
          {
            textPt: 'Calares e deixar o silêncio ser o facto.',
            resolution: { kind: 'fixed', nextNodeId: 'gate_release' },
            effects: { playerHpLossPercent: 11, enemyHpDelta: -4 },
          },
          {
            textPt:
              'Insistires balbuciando — pagar o ridículo e arrancar mesquinhez ao espelho.',
            resolution: { kind: 'fixed', nextNodeId: 'gate_release' },
            effects: { playerHpLossPercent: 15, enemyHpDelta: -6 },
          },
        ],
      },
      c_l_fail_b_ok: {
        linePt:
          'A segunda moeda cai do lado certo por milímetro. O reflexo engole o desapontamento; tu engoles oxigénio.',
        choices: [
          {
            textPt: 'Não tentar uma terceira — sabedoria de quem sobreviveu a casinos.',
            resolution: { kind: 'fixed', nextNodeId: 'gate_release' },
            effects: { enemyHpDelta: -4 },
          },
          {
            textPt:
              'Guardar a sensação de “por pouco” como aviso, não como heroísmo.',
            resolution: { kind: 'fixed', nextNodeId: 'gate_release' },
            effects: { enemyHpDelta: -3 },
          },
        ],
      },
      c_l_fail_b_bad: {
        linePt:
          'A segunda moeda ruge a rir. O corredor inclina-se para o bronze; tu sentes o piso a sugerir joelhos.',
        choices: [
          {
            textPt: 'Recusar joelhos; pagar em pele e sangue imaginário.',
            resolution: { kind: 'fixed', nextNodeId: 'gate_toll' },
            effects: { playerHpLossPercent: 16, enemyHpDelta: -5 },
          },
          {
            textPt:
              'Aceitar um joelho só no chão real — pedra fria — e roubar ao mito a postura de rendição completa.',
            resolution: { kind: 'fixed', nextNodeId: 'gate_toll' },
            effects: { playerHpLossPercent: 12, enemyHpDelta: -4 },
          },
        ],
      },
      c_l_fail_c: {
        linePt:
          'Tremer sem discurso é oferta estranha ao espelho: ele não sabe se goza ou se inveja. O metal fica sem frase pronta para a vergonha honesta.',
        choices: [
          {
            textPt: 'Deixar o tremor ficar contigo até passar.',
            resolution: { kind: 'fixed', nextNodeId: 'gate_release' },
            effects: { playerHpLossPercent: 10, enemyHpDelta: -5 },
          },
          {
            textPt:
              'Agarrar o tremor como prova viva — “isto não é teatro”.',
            resolution: { kind: 'fixed', nextNodeId: 'gate_toll' },
            effects: { playerHpLossPercent: 11, enemyHpDelta: -6 },
          },
        ],
      },

      c_bl_a: {
        linePt:
          'O bronze ainda resiste, mas já não como muralha: como pele depois de febre. O outro no bronze testa se vais voltar à agressão por hábito.',
        choices: [
          {
            textPt:
              'Esperar mais um compasso; deixar a paciência fazer o trabalho sujo da coragem.',
            resolution: {
              kind: 'skill',
              attr: 'mind',
              tn: 8,
              successNodeId: 'c_bl_a_ok',
              failNodeId: 'c_bl_a_fail',
            },
            effectsOnSuccess: { enemyHpDelta: -4 },
            effectsOnFailure: { playerHpLossPercent: 5, enemyHpDelta: 2 },
          },
          {
            textPt:
              'Impacientar-te: exigir resposta imediata à porta que ainda arrefece.',
            resolution: { kind: 'fixed', nextNodeId: 'c_bl_a_rush' },
            effects: { enemyHpDelta: 2 },
          },
          {
            textPt:
              'Oferecer desculpas sem palavras — só postura aberta, palmas visíveis, sem pose de herói.',
            resolution: { kind: 'fixed', nextNodeId: 'c_bl_a_body' },
            effects: { enemyHpDelta: -2 },
          },
        ],
      },
      c_bl_a_ok: {
        linePt:
          'A paciência não é virtude bonita aqui: é táctica. O reflexo fica sem estímulo e baixa o volume por puro tédio hostil.',
        choices: [
          {
            textPt: 'Sair da conversa antes que ela renasca.',
            resolution: { kind: 'fixed', nextNodeId: 'gate_release' },
            effects: { enemyHpDelta: -5 },
          },
          {
            textPt:
              'Marcar o silêncio como vitória sem monumento.',
            resolution: { kind: 'fixed', nextNodeId: 'gate_release' },
            effects: { enemyHpDelta: -4 },
          },
        ],
      },
      c_bl_a_fail: {
        linePt:
          'A paciente fingida vira passividade venenosa. O espelho enche o vazio com vozes que soam como tu — mas com melhor vocabulário.',
        choices: [
          {
            textPt: 'Quebrar a passividade com um gesto brusco e verdadeiro.',
            resolution: { kind: 'fixed', nextNodeId: 'gate_toll' },
            effects: { playerHpLossPercent: 9, enemyHpDelta: -3 },
          },
          {
            textPt:
              'Aceitar a voz e negociar com ela — caro, perigoso, teu.',
            resolution: { kind: 'fixed', nextNodeId: 'gate_toll' },
            effects: { playerHpLossPercent: 14, enemyHpDelta: -5 },
          },
        ],
      },
      c_bl_a_rush: {
        linePt:
          'A pressa alimenta o bronze outra vez. O reflexo adora prazos — transforma-os em culpa com data marcada.',
        choices: [
          {
            textPt: 'Retirar a pressa de súbito — parar no meio do passo.',
            resolution: { kind: 'fixed', nextNodeId: 'gate_toll' },
            effects: { playerHpLossPercent: 7, enemyHpDelta: -2 },
          },
          {
            textPt:
              'Manter a pressa e pagar o colapso — vitória em cinzas.',
            resolution: { kind: 'fixed', nextNodeId: 'gate_toll' },
            effects: { playerHpLossPercent: 17, enemyHpDelta: -6 },
          },
        ],
      },
      c_bl_a_body: {
        linePt:
          'Palmas visíveis não são rendição: são geografia. O espelho tenta ler sinais de fraqueza e encontra só anatomia.',
        choices: [
          {
            textPt: 'Fechar com calma corporal, sem slogan.',
            resolution: { kind: 'fixed', nextNodeId: 'gate_toll' },
            effects: { enemyHpDelta: -4 },
          },
          {
            textPt:
              'Baixar as mãos devagar — ritmo de quem encerra conversa, não de quem implora.',
            resolution: { kind: 'fixed', nextNodeId: 'gate_toll' },
            effects: { enemyHpDelta: -5 },
          },
        ],
      },

      c_bl_b: {
        linePt:
          'Fogo com fogo espessa o verde do bronze. O reflexo inventa versões tuas — piores, mais limpas, mais cruéis — e quase te convence.',
        choices: [
          {
            textPt:
              'Engolir o orgulho e procurar a beira do silêncio antes que ele te procure com dentes.',
            resolution: { kind: 'fixed', nextNodeId: 'h_burn_merge' },
          },
          {
            textPt:
              'Manter o ritmo da provocação até ao fim — colisão, não teatro.',
            resolution: { kind: 'fixed', nextNodeId: 'h_burn_merge' },
          },
        ],
      },
      c_bl_c_ok: {
        linePt:
          'O avanço curto ocupa terreno sem discurso. O reflexo recua um milímetro — milímetro humano, não mito.',
        choices: [
          {
            textPt: 'Consolidar o terreno com mais um passo curto.',
            resolution: { kind: 'fixed', nextNodeId: 'gate_toll' },
            effects: { enemyHpDelta: -6 },
          },
          {
            textPt:
              'Parar a tempo — vitória por contenção, não por conquista.',
            resolution: { kind: 'fixed', nextNodeId: 'gate_toll' },
            effects: { enemyHpDelta: -5 },
          },
        ],
      },
      c_bl_c_bad: {
        linePt:
          'O corpo avança e o espelho devolve o avanço como escárnio sincronizado. Por um instante, és dois a tropeçar no mesmo sítio.',
        choices: [
          {
            textPt: 'Aceitar o embate e sair com dentes cerrados.',
            resolution: { kind: 'fixed', nextNodeId: 'gate_toll' },
            effects: { playerHpLossPercent: 13, enemyHpDelta: -4 },
          },
          {
            textPt:
              'Transformar o tropeço em rolagem feia — literal ou moral — e fugir do espelho por um segundo de assimetria.',
            resolution: { kind: 'fixed', nextNodeId: 'gate_toll' },
            effects: { playerHpLossPercent: 10, enemyHpDelta: -3 },
          },
        ],
      },


      linger_steady: {
        linePt:
          'O olhar “morto” ficou teu o suficiente para o corredor o reconhecer. Falta só fechar sem pose — uma linha humana, não um monumento — antes de o bronze voltar a pedir teatro.',
        choices: [
          {
            textPt:
              'Assentir por dentro e seguir: nada de frase final para o espelho roubar.',
            resolution: { kind: 'fixed', nextNodeId: 'gate_release' },
          },
          {
            textPt:
              'Permitir-te um som ridículo e real — rangido, expiração — para o metal não ficar com a banda sonora.',
            resolution: { kind: 'fixed', nextNodeId: 'gate_release' },
          },
          {
            textPt:
              'Medir o próximo passo como quem mede temperatura: devagar, sem desafio de palco.',
            resolution: { kind: 'fixed', nextNodeId: 'gate_release' },
          },
        ],
      },
      linger_irony: {
        linePt:
          'O absurdo já fez o trabalho; agora o corredor pede uma saída sem segunda peça. O reflexo ainda tenta copiar o teu timing — e chega atrasado.',
        choices: [
          {
            textPt:
              'Calar no meio do riso — deixar o metal sem eco para vestir.',
            resolution: { kind: 'fixed', nextNodeId: 'gate_release' },
          },
          {
            textPt:
              'Trocar duas palavras feias com o chão, não com o bronze — mundano de propósito.',
            resolution: { kind: 'fixed', nextNodeId: 'gate_release' },
          },
          {
            textPt:
              'Virar o ombro meio segundo: tempo suficiente para o mito perder fôlego.',
            resolution: { kind: 'fixed', nextNodeId: 'gate_release' },
          },
        ],
      },
      linger_shoulder: {
        linePt:
          'A fresta abriu por teimosia honesta. O espelho ainda quer transformar empurrão em discurso — e tu ainda respiras, o que já é conversa suficiente.',
        choices: [
          {
            textPt:
              'Passar sem discurso de vitória — só ocupação de espaço que o reflexo não consegue copiar de relance.',
            resolution: { kind: 'fixed', nextNodeId: 'gate_toll' },
          },
          {
            textPt:
              'Deixar o corpo lembrar ao corredor que pedra vem antes de lenda.',
            resolution: { kind: 'fixed', nextNodeId: 'gate_toll' },
          },
          {
            textPt:
              'Recusar celebrar: fechar a fresta com silêncio de oficina, não de palco.',
            resolution: { kind: 'fixed', nextNodeId: 'gate_toll' },
          },
        ],
      },
      linger_fatigue: {
        linePt:
          'O cansaço ficou contigo como testemunha chata e leal. O bronze insiste em ler isso como derrota; o corredor, porém, só quer saber como sais sem emprestar-lhe narrativa.',
        choices: [
          {
            textPt:
              'Levar o cansaço como resposta — sem explicar, sem pedir desculpa ao espelho.',
            resolution: { kind: 'fixed', nextNodeId: 'gate_release' },
          },
          {
            textPt:
              'Respirar alto o suficiente para o som ser teu, não réplica.',
            resolution: { kind: 'fixed', nextNodeId: 'gate_release' },
          },
          {
            textPt:
              'Seguir como quem fecha porta: mão na madeira, olhos no limiar, nada de pose.',
            resolution: { kind: 'fixed', nextNodeId: 'gate_release' },
          },
        ],
      },
      linger_winter: {
        linePt:
          'Na borda, o bronze aperta ainda por hábito — não por necessidade. O corredor deixa rangido na pedra como lembrete: sair também é língua, não só perna.',
        choices: [
          {
            textPt:
              'Levar o corte moral como peso aceite — sem pedir aplauso ao espelho.',
            resolution: { kind: 'fixed', nextNodeId: 'gate_toll' },
          },
          {
            textPt:
              'Fechar a garganta em faca muda — silêncio que não empresta guião ao metal.',
            resolution: { kind: 'fixed', nextNodeId: 'gate_toll' },
          },
          {
            textPt:
              'Empurrar o teatro até ao fim e aceitar o custo — colisão contada em carne, não em pose.',
            resolution: { kind: 'fixed', nextNodeId: 'gate_toll' },
          },
        ],
      },
      linger_burn: {
        linePt:
          'O calor verbal deixa cinza no peito. O reflexo ainda tenta brilhar — mas o corredor já escolheu o teu lado com rangido e frio na pedra.',
        choices: [
          {
            textPt:
              'Ancorar no corpo o suficiente para o fogo não virar monólogo.',
            resolution: { kind: 'fixed', nextNodeId: 'gate_toll' },
          },
          {
            textPt:
              'Sair da pira com queimadura assumida — caro, teu, sem segunda peça.',
            resolution: { kind: 'fixed', nextNodeId: 'gate_toll' },
          },
          {
            textPt:
              'Recusar o epílogo heroico: fechar em oficina, não em lenda.',
            resolution: { kind: 'fixed', nextNodeId: 'gate_toll' },
          },
        ],
      },
      gate_release: {
        linePt:
          'O limiar cede sem fanfarra: armistício feio, verdade miúda ou silêncio que não pede aplausos. O bronze ainda mexe os lábios — tarde. Falta só escolheres como atravessas sem lhe dar o último verso.',
        choices: [
          {
            textPt:
              'Atravessar como água parada — frio no peito, passo teu, réplica atrasada.',
            resolution: { kind: 'fixed', nextNodeId: 'v_win_release' },
          },
          {
            textPt:
              'Levar contigo um facto de cozinha, ridículo o bastante para não caber no mito.',
            resolution: { kind: 'fixed', nextNodeId: 'v_win_release' },
          },
          {
            textPt:
              'Sair no anti-clímax — sem pedestal, sem segunda peça para o metal roubar.',
            resolution: { kind: 'fixed', nextNodeId: 'v_win_release' },
          },
        ],
      },
      gate_toll: {
        linePt:
          'A vitória definitiva cheira a metal quente e pele: corpo, empurrão ou preço pago até à vergonha. O reflexo cala porque finalmente não tens de lhe dever performance — só tens de atravessar sem lhe dar o epílogo.',
        choices: [
          {
            textPt:
              'Pagar o custo em silêncio e seguir inteiro o suficiente — sem negociar com o teatro.',
            resolution: { kind: 'fixed', nextNodeId: 'v_win_toll' },
          },
          {
            textPt:
              'Levar o hematoma moral como mapa, não como prisão — e ocupar o corredor na mesma.',
            resolution: { kind: 'fixed', nextNodeId: 'v_win_toll' },
          },
          {
            textPt:
              'Fechar em colisão honesta: ombro, chão, fogo engolido — limite onde antes só havia cópia.',
            resolution: { kind: 'fixed', nextNodeId: 'v_win_toll' },
          },
        ],
      },
      v_win_release: {
        linePt:
          'O corredor deixa de exigir réplica: vitória de detalhe, de silêncio útil ou de mundo liso demais para o espelho mentir alto. O bronze fica com eco atrasado; tu segues com a palavra tua — feia, inteira, tua.',
        terminal: 'victory',
      },
      v_win_toll: {
        linePt:
          'Vitória paga em corpo e nervo: empurrão, limite físico ou sangue de palavra. Ainda assim o espelho ficou sem o teu último verso — escreveste tu, com custo que não negas e fronteira que ele aprende a respeitar.',
        terminal: 'victory',
      },
    },
  },
};
