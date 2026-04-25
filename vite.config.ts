import { Buffer } from 'node:buffer';
import { defineConfig, loadEnv } from 'vite';
import { normalizePexelsSearchResponse } from './src/dev/pexelsImageSearch.ts';
import { asciiSceneDevManifestPlugin } from './scripts/vite-ascii-scene-manifest-plugin.mjs';

function readPexelsApiKey(viteEnv: Record<string, string>): string | undefined {
  const k =
    viteEnv.PEXELS_API_KEY ??
    viteEnv.YOU_DECIDE_PEXELS_KEY ??
    process.env.PEXELS_API_KEY ??
    process.env.YOU_DECIDE_PEXELS_KEY;
  return k && k.trim() ? k.trim() : undefined;
}

/**
 * `base: './'` gera URLs relativas no HTML/JS, compatível com GitHub Pages em
 * `https://<user>.github.io/<repo>/` sem depender do nome do repositório.
 *
 * Dev-only: busca de imagens Pexels (`/__dev/image-search`) usa
 * `PEXELS_API_KEY` ou `YOU_DECIDE_PEXELS_KEY` em `.env.local`.
 * https://www.pexels.com/api/
 */
export default defineConfig(({ mode }) => {
  const viteEnv = loadEnv(mode, process.cwd(), '');
  return {
    base: './',
    plugins: [
      asciiSceneDevManifestPlugin(),
      {
        name: 'dev-image-proxy',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
          const raw = req.url ?? '';
          const q = raw.includes('?') ? raw.slice(raw.indexOf('?')) : '';
          const params = new URLSearchParams(q);

          if (raw.startsWith('/__dev/image-search')) {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            if (req.method !== 'GET' && req.method !== 'HEAD') {
              res.statusCode = 405;
              res.end(JSON.stringify({ error: 'method_not_allowed' }));
              return;
            }
            if (req.method === 'HEAD') {
              res.statusCode = 204;
              res.end();
              return;
            }
            const apiKey = readPexelsApiKey(viteEnv);
            if (!apiKey) {
              res.statusCode = 503;
              res.end(JSON.stringify({ error: 'missing_api_key' }));
              return;
            }
            const query = (params.get('q') ?? params.get('query') ?? '').trim();
            if (!query) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'missing_query' }));
              return;
            }
            let perPage = parseInt(params.get('per_page') ?? '12', 10);
            if (Number.isNaN(perPage)) perPage = 12;
            perPage = Math.max(1, Math.min(20, perPage));
            const pexelsUrl = new URL('https://api.pexels.com/v1/search');
            pexelsUrl.searchParams.set('query', query);
            pexelsUrl.searchParams.set('per_page', String(perPage));
            try {
              const r = await fetch(pexelsUrl, {
                headers: {
                  Authorization: apiKey,
                  'User-Agent': 'you-decide-dev-image-search/1',
                },
              });
              const text = await r.text();
              if (!r.ok) {
                res.statusCode = r.status >= 400 ? r.status : 502;
                res.end(JSON.stringify({ error: 'pexels_error', status: r.status, body: text.slice(0, 500) }));
                return;
              }
              let parsed: unknown;
              try {
                parsed = JSON.parse(text) as unknown;
              } catch {
                res.statusCode = 502;
                res.end(JSON.stringify({ error: 'invalid_json' }));
                return;
              }
              const hits = normalizePexelsSearchResponse(parsed);
              res.statusCode = 200;
              res.end(JSON.stringify({ hits }));
            } catch {
              res.statusCode = 502;
              res.end(JSON.stringify({ error: 'fetch_failed' }));
            }
            return;
          }

          if (!raw.startsWith('/__dev/image-proxy')) {
            next();
            return;
          }
          const target = params.get('url');
          if (!target) {
            res.statusCode = 400;
            res.end('missing url');
            return;
          }
          let parsedUrl: URL;
          try {
            parsedUrl = new URL(target);
          } catch {
            res.statusCode = 400;
            res.end('invalid url');
            return;
          }
          if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
            res.statusCode = 400;
            res.end('invalid protocol');
            return;
          }
          try {
            const r = await fetch(parsedUrl, {
              headers: { 'User-Agent': 'you-decide-dev-image-proxy/1' },
            });
            if (!r.ok) {
              res.statusCode = r.status;
              res.end();
              return;
            }
            const ct = r.headers.get('content-type') ?? 'application/octet-stream';
            const buf = Buffer.from(await r.arrayBuffer());
            res.setHeader('Content-Type', ct);
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(buf);
          } catch {
            res.statusCode = 502;
            res.end();
          }
        });
      },
    },
  ],
  };
});
