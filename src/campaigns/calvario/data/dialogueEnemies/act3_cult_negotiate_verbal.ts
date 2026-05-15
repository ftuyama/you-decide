import type { DialogueEnemyDef } from '../../../../engine/schema/index.ts';
import * as Spr from '../../ascii/sprites/enemies/index.ts';

/** Barganha com o encarregado antes do ferro (act3/lore/cult_negotiate). */
export const act3_cult_negotiate_verbal: DialogueEnemyDef = {
  id: 'act3_cult_negotiate_verbal',
  name: 'Encarregado do Terceiro Sino',
  sprite: Spr.act2_cultist.sprite,
  tensionMax: 15,
  graph: {
    rootNodeId: 'root',
    nodes: {
      root: {
        linePt:
          'O cultista inclina a moeda. “Contrato simples”, repete, voz seca. “Tu falas baixo; nós escrevemos baixo. Se a tua boca tremer, o cano lembra.” A tensão sobe do chão como humidade.',
        choices: [
          {
            textPt:
              'Enumerar cláusulas sem teatro — preço, silêncio, prazo, como quem fecha conta num balcão.',
            resolution: {
              kind: 'skill',
              attr: 'mind',
              tn: 8,
              successNodeId: 'measured',
              failNodeId: 'slip',
            },
            effectsOnSuccess: { enemyHpDelta: -4 },
            effectsOnFailure: { enemyHpDelta: 3 },
          },
          {
            textPt:
              'Calar e deixar o olhar dizer “não vim armado de discurso” — só de medida.',
            resolution: { kind: 'fixed', nextNodeId: 'quiet_line' },
            effects: { enemyHpDelta: -3 },
          },
          {
            textPt:
              'Cortar com arrogância: exigir que o Sino prove que não és descartável.',
            resolution: { kind: 'fixed', nextNodeId: 'sharp' },
            effects: { enemyHpDelta: 4 },
          },
        ],
      },
      measured: {
        linePt:
          '“Assim”, murmura ele. “Sem poesia. O cano gosta de gente que sabe contar até ao fim sem desviar o olhar.”',
        choices: [
          {
            textPt:
              'Fechar o tom: aceitar o contrato verbal aqui, sem aditivos — e deixar o gesto fechar a frase.',
            resolution: { kind: 'fixed', nextNodeId: 'contract_sealed' },
            effects: { enemyHpDelta: -3 },
          },
          {
            textPt:
              'Pedir uma linha de retirada honrosa — uma última frase que não suje.',
            resolution: {
              kind: 'luck',
              tn: 8,
              luckPenalty: 0,
              successNodeId: 'v_success',
              failNodeId: 'slip',
            },
            effectsOnSuccess: { enemyHpDelta: -3 },
            effectsOnFailure: { enemyHpDelta: 2 },
          },
        ],
      },
      contract_sealed: {
        linePt:
          'Ele inclina a cabeça um milímetro — não bênção, fecho de livro. “Assinado no ar”, diz. “O túnel lembra.”',
        choices: [
          {
            textPt: 'Recuar meio passo e deixar o silêncio ser o carimbo.',
            resolution: { kind: 'fixed', nextNodeId: 'v_success' },
            effects: { enemyHpDelta: -4 },
          },
        ],
      },
      quiet_line: {
        linePt:
          'O silêncio pesa dos dois lados. “Bom”, diz por fim. “Silêncio também assina.”',
        choices: [
          {
            textPt: 'Assentir com o queixo — sem palavra que possa virar faca.',
            resolution: { kind: 'fixed', nextNodeId: 'v_success' },
            effects: { enemyHpDelta: -4 },
          },
        ],
      },
      sharp: {
        linePt:
          '“Prova?” ri seco. “O cano não é tribunal. É dente.” Os dois atrás aproximam um passo.',
        choices: [
          {
            textPt:
              'Refazer o tom: descer o volume e pedir pragmática, não coroa.',
            resolution: {
              kind: 'skill',
              attr: 'mind',
              tn: 9,
              successNodeId: 'measured',
              failNodeId: 'd_fail',
            },
            effectsOnSuccess: { enemyHpDelta: -2 },
            effectsOnFailure: { enemyHpDelta: 2 },
          },
          {
            textPt: 'Manter o desafio aberto — ver quem pisca primeiro.',
            resolution: { kind: 'fixed', nextNodeId: 'd_fail' },
          },
        ],
      },
      slip: {
        linePt:
          'As palavras escorregam. “Ouvi medo a fingir prudência”, diz o encarregado. “O Sino mastiga isso.”',
        choices: [
          {
            textPt:
              'Agarrar à sobrevivência crua — ferro, sangue, sem metáfora.',
            resolution: {
              kind: 'skill',
              attr: 'str',
              tn: 9,
              successNodeId: 'v_success',
              failNodeId: 'd_fail',
            },
            effectsOnSuccess: { enemyHpDelta: -5 },
            effectsOnFailure: { enemyHpDelta: 2 },
          },
          {
            textPt: 'Recuar em titubeio — perder a linha.',
            resolution: { kind: 'fixed', nextNodeId: 'd_fail' },
          },
        ],
      },
      v_success: {
        linePt:
          '“Fechado”, diz ele, e recua meio passo. “Desce. E lembra: fora do túnel, o teu nome não ecoa.”',
        terminal: 'victory',
      },
      d_fail: {
        linePt:
          '“Chega de preâmbulo”, sibila. “Se não aguentas sílaba, aguenta ferro.”',
        terminal: 'defeat',
      },
    },
  },
};
