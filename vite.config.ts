import { Buffer } from 'node:buffer';
import { defineConfig } from 'vite';

/**
 * `base: './'` gera URLs relativas no HTML/JS, compatível com GitHub Pages em
 * `https://<user>.github.io/<repo>/` sem depender do nome do repositório.
 */
export default defineConfig({
  base: './',
  plugins: [
    {
      name: 'dev-image-proxy',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          const raw = req.url ?? '';
          if (!raw.startsWith('/__dev/image-proxy')) {
            next();
            return;
          }
          const q = raw.includes('?') ? raw.slice(raw.indexOf('?')) : '';
          const params = new URLSearchParams(q);
          const target = params.get('url');
          if (!target) {
            res.statusCode = 400;
            res.end('missing url');
            return;
          }
          let parsed: URL;
          try {
            parsed = new URL(target);
          } catch {
            res.statusCode = 400;
            res.end('invalid url');
            return;
          }
          if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
            res.statusCode = 400;
            res.end('invalid protocol');
            return;
          }
          try {
            const r = await fetch(parsed, {
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
});
