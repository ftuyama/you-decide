import fs from 'node:fs';
import path from 'node:path';

const VIRTUAL_RESOLVED = '\0virtual:ascii-scene-dev-manifest';
const VIRTUAL_PUBLIC = 'virtual:ascii-scene-dev-manifest';

/**
 * @param {string} projectRoot Vite `config.root`
 */
function buildAsciiSceneManifest(projectRoot) {
  const campaignsDir = path.join(projectRoot, 'src/campaigns');
  /** @type {Record<string, Array<{ key: string; path: string; mtimeMs: number }>>} */
  const out = {};
  if (!fs.existsSync(campaignsDir)) return out;
  for (const ent of fs.readdirSync(campaignsDir, { withFileTypes: true })) {
    if (!ent.isDirectory()) continue;
    const id = ent.name;
    const scenesDir = path.join(campaignsDir, id, 'ascii', 'scenes');
    const items = [];
    if (fs.existsSync(scenesDir)) {
      walk(scenesDir, scenesDir, items);
    }
    out[id] = items;
  }
  return out;

  /**
   * @param {string} dir
   * @param {string} base
   * @param {Array<{ key: string; path: string; mtimeMs: number }>} acc
   */
  function walk(dir, base, acc) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        walk(full, base, acc);
      } else if (e.isFile() && e.name.endsWith('.txt')) {
        const stat = fs.statSync(full);
        const rel = path.relative(base, full).split(path.sep).join('/');
        const key = e.name.replace(/\.txt$/u, '');
        acc.push({ key, path: rel, mtimeMs: stat.mtimeMs });
      }
    }
  }
}

export function asciiSceneDevManifestPlugin() {
  /** @type {string} */
  let projectRoot = process.cwd();

  return {
    name: 'ascii-scene-dev-manifest',
    configResolved(config) {
      projectRoot = config.root;
    },
    resolveId(id) {
      if (id === VIRTUAL_PUBLIC) return VIRTUAL_RESOLVED;
      return null;
    },
    load(id) {
      if (id !== VIRTUAL_RESOLVED) return null;
      const manifest = buildAsciiSceneManifest(projectRoot);
      for (const [campaignId, items] of Object.entries(manifest)) {
        for (const item of items) {
          const fp = path.join(
            projectRoot,
            'src/campaigns',
            campaignId,
            'ascii',
            'scenes',
            item.path
          );
          this.addWatchFile(fp);
        }
      }
      return `export default ${JSON.stringify(manifest)}`;
    },
  };
}
