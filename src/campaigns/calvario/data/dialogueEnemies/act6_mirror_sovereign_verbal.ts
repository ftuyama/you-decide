import type { DialogueEnemyDef } from '../../../../engine/schema/index.ts';
import * as Spr from '../../ascii/sprites/enemies/index.ts';

/** Reflexo soberano antes do ferro (act6/encounters/mirror_boss_intro). */
export const act6_mirror_sovereign_verbal: DialogueEnemyDef = {
  id: 'act6_mirror_sovereign_verbal',
  name: 'O reflexo soberano',
  sprite: Spr.act6_shadow_self.sprite,
  tensionMax: 22,
  graph: {
    rootNodeId: 'root',
    nodes: {
      root: {
        linePt:
          'Do espelho sai o teu rosto sem hesitação. “Eu sou tu sem medo”, diz. “Tu és eu sem coragem.” O sorriso dele não pede licença — pede rendição.',
        choices: [
          {
            textPt:
              'Nomear o medo sem poesia — o hábito feio, não o herói de palco.',
            resolution: {
              kind: 'skill',
              attr: 'mind',
              tn: 10,
              successNodeId: 'named',
              failNodeId: 'waver',
            },
            effectsOnSuccess: { enemyHpDelta: -4 },
            effectsOnFailure: {
              enemyHpDelta: 3,
              playerHpLossPercent: 6,
            },
          },
          {
            textPt:
              'Recusar o duelo de palavras: avançar devagar, sem discurso, só presença.',
            resolution: { kind: 'fixed', nextNodeId: 'silent_advance' },
            effects: { enemyHpDelta: -3 },
          },
          {
            textPt:
              'Atacar a imagem com fúria — provar que ainda mandas no teu rosto.',
            resolution: { kind: 'fixed', nextNodeId: 'waver' },
            effects: { enemyHpDelta: 4 },
          },
        ],
      },
      silent_advance: {
        linePt:
          '“Corpo sem frase”, murmura ele, irritado. “Isso também é linguagem — só que eu sei lê-la.”',
        choices: [
          {
            textPt:
              'Manter o passo até o sorriso dele falhar — ombro baixo, olhar que não pede aplauso.',
            resolution: {
              kind: 'skill',
              attr: 'str',
              tn: 10,
              successNodeId: 'named',
              failNodeId: 'strain',
            },
            effectsOnSuccess: { enemyHpDelta: -4 },
            effectsOnFailure: { enemyHpDelta: 2, playerHpLossPercent: 5 },
          },
          {
            textPt:
              'Dar ao reflexo uma frase mínima — verdade miúda, sem lenda — para o vidro engasgar.',
            resolution: {
              kind: 'skill',
              attr: 'mind',
              tn: 10,
              successNodeId: 'named',
              failNodeId: 'strain',
            },
            effectsOnSuccess: { enemyHpDelta: -3 },
            effectsOnFailure: { enemyHpDelta: 2, playerHpLossPercent: 5 },
          },
          {
            textPt:
              'Confiar no ritmo: deixar o acaso decidir se o silêncio te protege ou se o corredor te expõe.',
            resolution: {
              kind: 'luck',
              tn: 10,
              luckPenalty: 1,
              successNodeId: 'named',
              failNodeId: 'waver',
            },
            effectsOnSuccess: { enemyHpDelta: -3 },
            effectsOnFailure: { enemyHpDelta: 3, playerHpLossPercent: 5 },
          },
        ],
      },
      named: {
        linePt:
          'O reflexo pisca — uma fração humana. “…Nomear”, repete, como quem odeia perder o argumento. “Isso não é vitória. É freio.”',
        choices: [
          {
            textPt:
              'Traçar fronteira: sombra fica no vidro; tu ficas no corredor.',
            resolution: { kind: 'fixed', nextNodeId: 'last_test' },
            effects: { enemyHpDelta: -4 },
          },
          {
            textPt:
              'Calar e deixar o silêncio fechar o acordo — sem segunda peça para ele roubar.',
            resolution: {
              kind: 'luck',
              tn: 10,
              luckPenalty: 0,
              successNodeId: 'last_test',
              failNodeId: 'waver',
            },
            effectsOnSuccess: { enemyHpDelta: -3 },
            effectsOnFailure: { enemyHpDelta: 3 },
          },
          {
            textPt:
              'Exigir prova física: tocar o batente com a palma e ver qual mundo responde primeiro.',
            resolution: {
              kind: 'skill',
              attr: 'str',
              tn: 11,
              successNodeId: 'last_test',
              failNodeId: 'strain',
            },
            effectsOnSuccess: { enemyHpDelta: -4 },
            effectsOnFailure: { enemyHpDelta: 2, playerHpLossPercent: 6 },
          },
        ],
      },
      last_test: {
        linePt:
          'A fronteira está traçada; o vidro ainda tenta colonizar-te com um último sorriso. “Mostra”, sussurra o reflexo, “como fechas sem me dar o epílogo.”',
        choices: [
          {
            textPt:
              'Aceitar a trégua feia — levar o que ainda é teu, sem discurso final.',
            resolution: { kind: 'fixed', nextNodeId: 'v_success' },
            effects: { enemyHpDelta: -5 },
          },
          {
            textPt:
              'Responder com mente fria: uma cláusula, um preço, nada de mito.',
            resolution: {
              kind: 'skill',
              attr: 'mind',
              tn: 11,
              successNodeId: 'v_success',
              failNodeId: 'strain',
            },
            effectsOnSuccess: { enemyHpDelta: -5 },
            effectsOnFailure: { enemyHpDelta: 2, playerHpLossPercent: 7 },
          },
          {
            textPt:
              'Partir o instante com agilidade — um passo que quebra a sincronia antes que ele copie.',
            resolution: {
              kind: 'skill',
              attr: 'agi',
              tn: 10,
              successNodeId: 'v_success',
              failNodeId: 'd_fail',
            },
            effectsOnSuccess: { enemyHpDelta: -4 },
            effectsOnFailure: { enemyHpDelta: 3 },
          },
        ],
      },
      strain: {
        linePt:
          'O reflexo lê cada tensão no teu pescoço como promessa de queda. “Vês?” murmura. “O corpo já assinou antes da boca.”',
        choices: [
          {
            textPt:
              'Dizer o teu nome em voz alta — âncora feia, sem pose de palco.',
            resolution: {
              kind: 'skill',
              attr: 'mind',
              tn: 11,
              successNodeId: 'v_success',
              failNodeId: 'd_fail',
            },
            effectsOnSuccess: { enemyHpDelta: -6 },
            effectsOnFailure: { enemyHpDelta: 2, playerHpLossPercent: 8 },
          },
          {
            textPt:
              'Recuar o queixo, abrir as mãos visíveis — geografia de rendição mínima, não de teatro.',
            resolution: {
              kind: 'skill',
              attr: 'agi',
              tn: 10,
              successNodeId: 'v_success',
              failNodeId: 'd_fail',
            },
            effectsOnSuccess: { enemyHpDelta: -5 },
            effectsOnFailure: { enemyHpDelta: 2 },
          },
        ],
      },
      waver: {
        linePt:
          '“Vês?” sussurra o reflexo. “Já vacilaste antes da lâmina.”',
        choices: [
          {
            textPt:
              'Agarrar à última linha: dizer o teu nome em voz alta como âncora.',
            resolution: {
              kind: 'skill',
              attr: 'mind',
              tn: 11,
              successNodeId: 'last_test',
              failNodeId: 'd_fail',
            },
            effectsOnSuccess: { enemyHpDelta: -4 },
            effectsOnFailure: { enemyHpDelta: 2, playerHpLossPercent: 7 },
          },
          {
            textPt: 'Deixar a dúvida ganhar terreno.',
            resolution: { kind: 'fixed', nextNodeId: 'd_fail' },
          },
        ],
      },
      v_success: {
        linePt:
          'O reflexo recua meio tom — não derrota limpa, trégua. “Vai”, diz com a tua boca. “Leva o que ainda é teu.”',
        terminal: 'victory',
      },
      d_fail: {
        linePt:
          '“Então ao ferro”, diz ele — e o espelho deixa de negociar.',
        terminal: 'defeat',
      },
    },
  },
};
