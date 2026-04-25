/**
 * Normaliza a resposta JSON da API de pesquisa Pexels (`GET /v1/search`).
 * Chave de API: definir `PEXELS_API_KEY` ou `SILENT_DUNGEON_PEXELS_KEY` em `.env.local`
 * (só usada no middleware Vite em dev). Criar chave em https://www.pexels.com/api/
 */

export type PexelsImageHit = {
  id: string;
  pageUrl: string;
  photographer: string;
  photographerUrl: string;
  /** URL para conversão Braille (tamanho médio/grande). */
  imageUrl: string;
  /** Miniatura para o cartão. */
  thumbUrl: string;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function pickString(r: Record<string, unknown>, key: string): string | undefined {
  const v = r[key];
  return typeof v === 'string' && v.trim() ? v.trim() : undefined;
}

function pickSrcUrls(src: unknown): { imageUrl?: string; thumbUrl?: string } {
  if (!isRecord(src)) return {};
  const large2x = pickString(src, 'large2x');
  const large = pickString(src, 'large');
  const medium = pickString(src, 'medium');
  const small = pickString(src, 'small');
  const tiny = pickString(src, 'tiny');
  const portrait = pickString(src, 'portrait');
  const landscape = pickString(src, 'landscape');
  const original = pickString(src, 'original');
  const imageUrl = large2x ?? large ?? portrait ?? landscape ?? medium ?? original;
  const thumbUrl = tiny ?? small ?? medium ?? large ?? imageUrl;
  return { imageUrl, thumbUrl };
}

/**
 * Extrai lista de hits a partir do corpo JSON da Pexels. Ignora entradas incompletas.
 */
export function normalizePexelsSearchResponse(body: unknown): PexelsImageHit[] {
  if (!isRecord(body)) return [];
  const photos = body.photos;
  if (!Array.isArray(photos)) return [];

  const out: PexelsImageHit[] = [];
  for (const p of photos) {
    if (!isRecord(p)) continue;
    const idRaw = p.id;
    const id = typeof idRaw === 'number' ? String(idRaw) : typeof idRaw === 'string' ? idRaw : '';
    const pageUrl = pickString(p, 'url') ?? '';
    const photographer = pickString(p, 'photographer') ?? '';
    const photographerUrl = pickString(p, 'photographer_url') ?? '';
    const { imageUrl, thumbUrl } = pickSrcUrls(p.src);
    if (!id || !imageUrl) continue;
    out.push({
      id,
      pageUrl,
      photographer,
      photographerUrl,
      imageUrl,
      thumbUrl: thumbUrl ?? imageUrl,
    });
  }
  return out;
}
