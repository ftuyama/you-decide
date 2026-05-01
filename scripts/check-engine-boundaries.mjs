/**
 * Impede imports profundos do engine fora de `src/engine`.
 * Regra: `src/ui`, `src/campaigns`, `src/content` e `tests` só podem importar
 * `src/engine/<dominio>/index.ts` (ou `src/engine/schema/...`).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, '..');
const scopes = ['src/ui', 'src/campaigns', 'src/content', 'tests'];

const importRe = /from\s+['"]([^'"]+)['"]/g;
const allowedEngineRe = /(^|\/)engine\/(core|combat|progression|world|data)\/index\.ts$/;
const allowedSchemaRe = /(^|\/)engine\/schema\/(?:index\.ts|[^/]+\.ts)$/;
const deepEngineRe = /(^|\/)engine\/(core|combat|progression|world|data)\/[^/]+\.ts$/;

function walkTsFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkTsFiles(full));
      continue;
    }
    if (entry.isFile() && (full.endsWith('.ts') || full.endsWith('.tsx'))) out.push(full);
  }
  return out;
}

const violations = [];

for (const scope of scopes) {
  const abs = path.join(repoRoot, scope);
  if (!fs.existsSync(abs)) continue;
  for (const file of walkTsFiles(abs)) {
    const raw = fs.readFileSync(file, 'utf8');
    importRe.lastIndex = 0;
    let m;
    while ((m = importRe.exec(raw)) !== null) {
      const spec = m[1];
      if (!spec.includes('engine/')) continue;
      if (allowedEngineRe.test(spec) || allowedSchemaRe.test(spec)) continue;
      if (deepEngineRe.test(spec)) {
        violations.push(`${path.relative(repoRoot, file)} -> ${spec}`);
      }
    }
  }
}

if (violations.length > 0) {
  console.error('Imports profundos do engine encontrados (use index.ts do domínio):');
  for (const v of violations) console.error(`  - ${v}`);
  process.exit(1);
}

console.log('OK: fronteiras de import do engine preservadas.');
