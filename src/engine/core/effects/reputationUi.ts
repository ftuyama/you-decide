import type { FactionId } from '../../schema/index.ts';
import type { EventBus } from '../eventBus.ts';

export const FACTION_NAME_PT: Record<FactionId, string> = {
  vigilia: 'Vigília',
  circulo: 'Círculo',
  culto: 'Culto',
};

const REPUTATION_TONE_UP_PT: Record<FactionId, readonly string[]> = {
  vigilia: [
    'Ecoa nos corredores da ordem: o teu nome ganha um selo menos sombrio nos arquivos da Vigília.',
    'Oficiais murmuram com outra cadência — patrulha e juramento passam a contar contigo, ainda que com ferro na voz.',
    'Um escrivão inclina a pena: onde antes só havia desconfiança medida, agora há lugar para um voto de cautela favorável.',
    'A lanterna da Vigília inclina-se um palmo na tua direção; não é abraço, é reconhecimento de quem serve sem ruído.',
  ],
  circulo: [
    'O cinzento inclina-se: nos arquivos do Círculo, o teu símbolo ganha um traço que não apaga com o primeiro sopro.',
    'Troca-se sorte por assinatura — o Círculo anota o feito como quem fecha metade de um pacto ainda aberto.',
    'Rituais frágeis aprendem o teu nome; quem empresta destino cobra, mas hoje o saldo pende a teu favor.',
    'Uma linha nova no livro cinzento: não é bênção, é contrato — e o mundo leu a cláusula com mais brandura.',
  ],
  culto: [
    'O Terceiro Sino parece mais perto sem haver torre: o Culto carimba o teu passo com interesse que não é benigno, mas é teu.',
    'Devotos sussurram versículos onde antes calavam; a corrupção, quando te nomeia, faz-o quase como elegia.',
    'Marca-se o pergaminho com cinza e vela: o Culto guarda o teu feito como quem guarda ferramenta para noite melhor.',
    'Eco que não devia existir reconhece-te; quem ouve o sino sem badalação sabe que o Culto te contou entre os seus.',
  ],
};

const REPUTATION_TONE_DOWN_PT: Record<FactionId, readonly string[]> = {
  vigilia: [
    'Raspa-se o registo: a Vigília anota desconfiança onde antes só havia silêncio disciplinado.',
    'Patrulhas trocam olhar quando passes — juramento virou suspeita, e o mundo nota o peso novo na couraça.',
    'Um oficial fecha o dossiê com gesto seco: honra tem gosto de cinza, e hoje o teu nome soube a ferro.',
    'Ordem não perdoa rumor: nos corredores, o teu nome desce de tom; quem serve nota quando deixa de ser ferramenta confiável.',
  ],
  circulo: [
    'O ritual recua: o Círculo descreve o teu nome com traço mais frio, como quem adia uma dívida que não esquece.',
    'Símbolos que brilhavam hesitam; o cinzento fecha sem ti, e o empréstimo de sorte cobra juros em silêncio.',
    'Raspa-se margem no livro de contas — o Círculo não grita, apenas deixa de inclinar a balança a teu favor.',
    'Quem troca destino por sinal aprende o preço: hoje o Círculo leu o teu feito com olhos de credor impaciente.',
  ],
  culto: [
    'Alguém no Culto apaga uma linha que te favorecia; ouve-se o sino sem torre, e o som não te chama.',
    'Devotos desviam o olhar onde antes bendiziam sombras; a corrupção ainda te conhece, mas já não te acolhe com o mesmo riso.',
    'Marca-se o pergaminho com salitre e cinza: o Terceiro Sino lembra o teu nome para advertência, não para culto.',
    'Onde havia interesse sombrio, agora há recuo ritual: o Culto guarda o teu feito como quem guarda faca embrulhada.',
  ],
};

const REPUTATION_UI_SLOW_LEDGER_PT: readonly string[] = [
  'Um gesto ficou assinado nas margens do teu registo; falta outro feito para que o numero mude nos arquivos da faccao.',
  'Os escribas anotam o rumor e fecham o livro sem mexer no marcador: ainda nao ha peso suficiente para virar a pagina.',
  'A faccao ouviu, mas guardou o eco em nota de rodape; o saldo so muda quando o proximo sinal confirmar a tendencia.',
  'Nos corredores, teu nome circula em voz baixa: a reputacao ainda nao desloca o ponteiro oficial.',
];

const REPUTATION_UI_CAPPED_DIRECT_PT: readonly string[] = [
  'Os escribas ja nao tem onde subir ou descer este nome: o tom mantem-se, por ora, inamovivel.',
  'A margem do registro terminou; qualquer novo abalo bate no limite e retorna sem alterar o numero.',
  'Selo no topo e lacre no fundo: nesta faccao, tua reputacao encostou no extremo permitido.',
  'O arquivo range, mas nao cede: os limites da faccao travam qualquer ajuste adicional neste momento.',
];

function pickRandomUiLine(lines: readonly string[]): string {
  if (lines.length === 0) return '';
  const idx = Math.floor(Math.random() * lines.length);
  return lines[idx] ?? '';
}

function pickReputationToneLine(
  lines: readonly string[],
  prev: number,
  next: number,
  faction: FactionId
): string {
  if (lines.length === 0) return '';
  let h = 0;
  for (let i = 0; i < faction.length; i++) {
    h = (h * 31 + faction.charCodeAt(i)!) >>> 0;
  }
  const idx = (h + prev * 17 + next * 13) % lines.length;
  return lines[idx]!;
}

function reputationTonePt(faction: FactionId, prev: number, next: number): string {
  if (next > prev) {
    return pickReputationToneLine(REPUTATION_TONE_UP_PT[faction], prev, next, faction);
  }
  if (next < prev) {
    return pickReputationToneLine(REPUTATION_TONE_DOWN_PT[faction], prev, next, faction);
  }
  return '';
}

export function emitReputationUi(
  bus: EventBus,
  faction: FactionId,
  prev: number,
  next: number,
  kind: 'standing' | 'slowLedger' | 'cappedDirect'
): void {
  const name = FACTION_NAME_PT[faction];
  if (kind === 'slowLedger') {
    bus.emit({
      type: 'statusHighlight',
      variant: 'neutral',
      title: `${name} — rumor em aberto`,
      subtitle: pickRandomUiLine(REPUTATION_UI_SLOW_LEDGER_PT),
    });
    return;
  }
  if (kind === 'cappedDirect') {
    bus.emit({
      type: 'statusHighlight',
      variant: 'neutral',
      title: `${name} — margens esgotadas`,
      subtitle: pickRandomUiLine(REPUTATION_UI_CAPPED_DIRECT_PT),
    });
    return;
  }
  const improved = next > prev;
  const variant: 'good' | 'bad' | 'neutral' = improved ? 'good' : next < prev ? 'bad' : 'neutral';
  const delta = next - prev;
  const deltaStr = delta === 0 ? '' : ` (${delta > 0 ? '+' : ''}${delta})`;
  bus.emit({
    type: 'statusHighlight',
    variant,
    title: `${name} — reputação ${deltaStr ? (improved ? 'sobe' : 'cai') : 'ajusta-se'}${deltaStr}`,
    subtitle: `${reputationTonePt(faction, prev, next)} Valor: ${prev} → ${next}.`,
    ...(variant === 'bad' ? { autoDismissMs: 0 } : {}),
  });
}
