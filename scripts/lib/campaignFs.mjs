/**
 * Shared filesystem helpers for campaign scene validators (Node ESM).
 */
import fs from 'fs';
import path from 'path';
import { parse as parseYaml } from 'yaml';

/**
 * @param {string} repoRoot - project root (parent of scripts/)
 */
export function campaignPaths(repoRoot, campaignId) {
  const campaignRoot = path.join(repoRoot, 'src', 'campaigns', campaignId);
  return {
    campaignRoot,
    scenesDir: path.join(campaignRoot, 'scenes'),
    indexPath: path.join(campaignRoot, 'index.json'),
  };
}

/** Recursively list all `.md` files under `dir`. */
export function walkMd(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, name.name);
    if (name.isDirectory()) walkMd(p).forEach((x) => out.push(x));
    else if (name.name.endsWith('.md')) out.push(p);
  }
  return out;
}

/** First line `id:` in raw markdown (frontmatter or not). */
export function extractSceneIdLine(raw) {
  const m = raw.match(/^id:\s*(.+)$/m);
  return m ? m[1].trim() : null;
}

/**
 * Split YAML frontmatter (same rules as find-unreachable / engine).
 * @returns {{ data: Record<string, unknown>, content: string }}
 */
export function splitFrontmatter(text) {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/);
  if (lines[0]?.trim() !== '---') {
    return { data: {}, content: text };
  }
  const yamlLines = [];
  let i = 1;
  while (i < lines.length) {
    const line = lines[i];
    if (line?.trim() === '---') {
      const yamlStr = yamlLines.join('\n');
      let data = {};
      if (yamlStr.trim()) {
        data = parseYaml(yamlStr) ?? {};
      }
      return { data, content: lines.slice(i + 1).join('\n') };
    }
    yamlLines.push(line ?? '');
    i++;
  }
  return { data: {}, content: text };
}

export function pathToSceneIdFromScenesDir(scenesDir, absolutePath) {
  const rel = path.relative(scenesDir, absolutePath);
  return rel.replace(/\\/g, '/').replace(/\.md$/, '');
}

/**
 * Parse `--campaign <id>` from argv; default `calvario`.
 * @param {string[]} argv
 */
export function parseCampaignArgv(argv) {
  let campaignId = 'calvario';
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--campaign' && argv[i + 1]) {
      campaignId = argv[i + 1];
      i++;
    }
  }
  return campaignId;
}
