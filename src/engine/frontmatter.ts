import { parse as parseYaml } from 'yaml';

/**
 * Extrai YAML + corpo Markdown (--- delimitadores). Compatível com browser (sem Buffer).
 */
export function splitFrontmatter(raw: string): { data: Record<string, unknown>; content: string } {
  const text = raw.replace(/^\uFEFF/, '');
  const lines = text.split(/\r?\n/);
  if (lines[0]?.trim() !== '---') {
    return { data: {}, content: text };
  }
  const yamlLines: string[] = [];
  let i = 1;
  while (i < lines.length) {
    const line = lines[i];
    if (line?.trim() === '---') {
      const content = lines.slice(i + 1).join('\n');
      const yamlStr = yamlLines.join('\n');
      let data: Record<string, unknown> = {};
      if (yamlStr.trim()) {
        try {
          const parsed = parseYaml(yamlStr);
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            data = parsed as Record<string, unknown>;
          }
        } catch (e) {
          console.error('YAML da cena inválido:', e);
          throw e;
        }
      }
      return { data, content };
    }
    yamlLines.push(line ?? '');
    i++;
  }
  return { data: {}, content: text };
}
