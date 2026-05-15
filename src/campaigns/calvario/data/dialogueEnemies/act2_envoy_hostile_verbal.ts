import type { DialogueEnemyDef } from '../../../../engine/schema/index.ts';
import * as Spr from '../../ascii/sprites/enemies/index.ts';

/** Escalada verbal antes do caçador (act2/faction/vigilia_envoy, rep ≤ −2). */
export const act2_vigilia_envoy_verbal: DialogueEnemyDef = {
  id: 'act2_vigilia_envoy_verbal',
  name: 'Capeador da Vigília',
  sprite: Spr.act4_vigil_hunter.sprite,
  tensionMax: 12,
  graph: {
    rootNodeId: 'root',
    nodes: {
      root: {
        linePt:
          'A lanterna sobe um dedo. “Quem o subsolo nomeia, a Vigília repete”, diz a voz — não sermão, acusação em fila. “Tua língua cheira a pacto com sombra.”',
        choices: [
          {
            textPt:
              'Responder com regimento: ordem, corredor, dever — sem insulto, sem pedido de perdão.',
            resolution: {
              kind: 'skill',
              attr: 'mind',
              tn: 7,
              successNodeId: 'steady',
              failNodeId: 'heat',
            },
            effectsOnSuccess: { enemyHpDelta: -4 },
            effectsOnFailure: { enemyHpDelta: 2 },
          },
          {
            textPt:
              'Baixar a palma — mostrar que não trazes lâmina à conversa, só peito.',
            resolution: { kind: 'fixed', nextNodeId: 'steady' },
            effects: { enemyHpDelta: -4 },
          },
          {
            textPt:
              'Escalar o insulto: perguntar se a Vigília só sabe contar medo alheio.',
            resolution: { kind: 'fixed', nextNodeId: 'heat' },
            effects: { enemyHpDelta: 4 },
          },
        ],
      },
      steady: {
        linePt:
          'O capeador fecha a mandíbula. “…Disciplina”, concede, amargo. “Não é absolvição.”',
        choices: [
          {
            textPt: 'Aceitar o veredito frio e pedir passagem sem desfile.',
            resolution: { kind: 'fixed', nextNodeId: 'v_success' },
            effects: { enemyHpDelta: -4 },
          },
        ],
      },
      heat: {
        linePt:
          '“Então ouve o metal a falar por mim”, rosna. O ar fica estreito.',
        choices: [
          {
            textPt:
              'Tentar segurar a linha com corpo inteiro — sem recuar o pé.',
            resolution: {
              kind: 'skill',
              attr: 'str',
              tn: 8,
              successNodeId: 'v_success',
              failNodeId: 'd_fail',
            },
            effectsOnSuccess: { enemyHpDelta: -4 },
            effectsOnFailure: { enemyHpDelta: 2 },
          },
          {
            textPt: 'Deixar a provocação ganhar — perder o compasso.',
            resolution: { kind: 'fixed', nextNodeId: 'd_fail' },
          },
        ],
      },
      v_success: {
        linePt:
          '“Segue”, diz por fim, lanterna já virada para o lado. “Mas o teu rasto fica na lista.”',
        terminal: 'victory',
      },
      d_fail: {
        linePt:
          '“Sem tribunal”, diz. “Só conta.” A lâmina sai antes da frase acabar.',
        terminal: 'defeat',
      },
    },
  },
};

/** Cinza vivo antes do adepto (act2/faction/circulo_envoy, rep ≤ −2). */
export const act2_circulo_envoy_verbal: DialogueEnemyDef = {
  id: 'act2_circulo_envoy_verbal',
  name: 'Voz do Círculo',
  sprite: Spr.act2_skeleton.sprite,
  tensionMax: 12,
  graph: {
    rootNodeId: 'root',
    nodes: {
      root: {
        linePt:
          'O cinza sobe como respiração. “Emprestamos forma”, sussurra a voz. “Rasgar é declarar guerra ao que já morreu uma vez.”',
        choices: [
          {
            textPt:
              'Falar como quem respeita o empréstimo — pedir prazo, não vitória.',
            resolution: {
              kind: 'skill',
              attr: 'mind',
              tn: 7,
              successNodeId: 'respect',
              failNodeId: 'fray',
            },
            effectsOnSuccess: { enemyHpDelta: -4 },
            effectsOnFailure: { enemyHpDelta: 2 },
          },
          {
            textPt:
              'Tocar o símbolo com dois dedos só — reverência mínima, sem teatro.',
            resolution: { kind: 'fixed', nextNodeId: 'respect' },
            effects: { enemyHpDelta: -4 },
          },
          {
            textPt:
              'Insultar o ritual: dizer que o Círculo é cinza de covardia.',
            resolution: { kind: 'fixed', nextNodeId: 'fray' },
            effects: { enemyHpDelta: 4 },
          },
        ],
      },
      respect: {
        linePt:
          'O cinza acalma na palma. “Bom”, diz a voz. “Quem sabe pedir, sabe devolver.”',
        choices: [
          {
            textPt: 'Prometer devolução sem jacto — e calar.',
            resolution: { kind: 'fixed', nextNodeId: 'v_success' },
            effects: { enemyHpDelta: -4 },
          },
        ],
      },
      fray: {
        linePt:
          '“Sangue barato”, ri o osso no ar. O desenho fecha como mordida.',
        choices: [
          {
            textPt:
              'Tentar refazer o gesto — mão aberta, palavra curta.',
            resolution: {
              kind: 'luck',
              tn: 7,
              luckPenalty: 0,
              successNodeId: 'v_success',
              failNodeId: 'd_fail',
            },
            effectsOnSuccess: { enemyHpDelta: -4 },
            effectsOnFailure: { enemyHpDelta: 2 },
          },
          {
            textPt: 'Rasgar de vez o ar entre vós.',
            resolution: { kind: 'fixed', nextNodeId: 'd_fail' },
          },
        ],
      },
      v_success: {
        linePt:
          '“Leva o empréstimo”, suspira a voz. “E não forces o Círculo a cobrar à mão.”',
        terminal: 'victory',
      },
      d_fail: {
        linePt: '“Então paga”, diz — e o osso acorda.',
        terminal: 'defeat',
      },
    },
  },
};

/** Sino sem badalo antes da patrulha (act2/faction/culto_envoy, rep ≤ −2). */
export const act2_culto_envoy_verbal: DialogueEnemyDef = {
  id: 'act2_culto_envoy_verbal',
  name: 'Porta-voz do Terceiro Sino',
  sprite: Spr.act2_cultist.sprite,
  tensionMax: 12,
  graph: {
    rootNodeId: 'root',
    nodes: {
      root: {
        linePt:
          'O sino vibra sem badalo. “Devoto paga silêncio com silêncio”, diz a sombra. “Tu pagaste com escândalo.”',
        choices: [
          {
            textPt:
              'Oferecer contrato mínimo: ouvir, responder curto, sem profanar o nome.',
            resolution: {
              kind: 'skill',
              attr: 'mind',
              tn: 7,
              successNodeId: 'tight',
              failNodeId: 'ring',
            },
            effectsOnSuccess: { enemyHpDelta: -4 },
            effectsOnFailure: { enemyHpDelta: 2 },
          },
          {
            textPt:
              'Ajoelhar a palavra — não o joelho: admitir dívida sem teatro.',
            resolution: { kind: 'fixed', nextNodeId: 'tight' },
            effects: { enemyHpDelta: -4 },
          },
          {
            textPt:
              'Cortar a oração com desdém — provar que não temes o rumor.',
            resolution: { kind: 'fixed', nextNodeId: 'ring' },
            effects: { enemyHpDelta: 4 },
          },
        ],
      },
      tight: {
        linePt:
          '“…Dívida reconhecida”, murmura a sombra. “O Sino gosta de quem não finge pagamento.”',
        choices: [
          {
            textPt: 'Fechar com um “sim” seco e esperar o recuo.',
            resolution: { kind: 'fixed', nextNodeId: 'v_success' },
            effects: { enemyHpDelta: -4 },
          },
        ],
      },
      ring: {
        linePt:
          '“Então ouve o badalo que não vem”, diz a voz — e o túnel encosta-te.',
        choices: [
          {
            textPt:
              'Tentar segurar postura sem recuar o corpo.',
            resolution: {
              kind: 'skill',
              attr: 'agi',
              tn: 7,
              successNodeId: 'v_success',
              failNodeId: 'd_fail',
            },
            effectsOnSuccess: { enemyHpDelta: -4 },
            effectsOnFailure: { enemyHpDelta: 2 },
          },
          {
            textPt: 'Perder o fio — deixar o insulto abrir caminho.',
            resolution: { kind: 'fixed', nextNodeId: 'd_fail' },
          },
        ],
      },
      v_success: {
        linePt:
          '“Vai”, diz por fim. “O Sino anota. Não perdoes a ti mesmo — perdoa-nos o silêncio.”',
        terminal: 'victory',
      },
      d_fail: {
        linePt: '“Sem preâmbulo”, sibila. “O cano cobra.”',
        terminal: 'defeat',
      },
    },
  },
};
