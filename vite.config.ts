import { defineConfig } from 'vite';

/**
 * `base: './'` gera URLs relativas no HTML/JS, compatível com GitHub Pages em
 * `https://<user>.github.io/<repo>/` sem depender do nome do repositório.
 */
export default defineConfig({
  base: './',
});
