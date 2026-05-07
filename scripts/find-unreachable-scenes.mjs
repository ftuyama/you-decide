/**
 * Wrapper para manter compatibilidade com `node scripts/find-unreachable-scenes.mjs`.
 * A implementação está em TypeScript e reutiliza constantes do engine.
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const scriptPath = path.join(__dirname, 'find-unreachable-scenes.ts');

const child = spawnSync('tsx', [scriptPath, ...process.argv.slice(2)], { stdio: 'inherit' });
process.exit(child.status ?? 1);
