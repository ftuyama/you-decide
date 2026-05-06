---
description: Preenche arte ASCII Braille pendente (artKey) a partir de imagens — alinhado ao painel DevTools e ao CLI do repo.
---

# Braille ASCII: arte pendente (`artKey`)

Executa o fluxo completo para cenas com `artKey` sem ficheiro `.txt` ou com ficheiro vazio em `ascii/scenes/**`.

## 1. Inventário

- Corre `npm run check:ascii-art` (opcional: `--campaign calvario`).
- Para cada entrada pendente, regista: `sceneId`, `artKey`, caminho do `.md` da cena.
- Lê o texto da cena (título, tom) para escolher uma imagem coerente com a narrativa (PT-BR na cena).

## 2. Imagem de referência

**Tom visual (obrigatório):** fantasia **medieval** sombria — *dark fantasy* enraizado em ruínas, natureza hostil, claustro, ritual, monstros, armaduras e armas antigas, neblina, cavernas, florestas mortas, pântanos, picos gelados, desertos de cinza. Luz baixa, contraste dramático, atmosfera **opressiva e melancólica**, sem romantizar.

**Evitar na escolha da foto:** cidades inteiras, arquitetura civil moderna ou renascentista “urbana”, skylines, ruas pavimentadas, mercados movimentados, civilização como protagonista (templos monumentais em plena metrópole, castelos em horizonte de capital). Prédios, arranha-céus, infraestrutura contemporânea, interior doméstico “confortável”, cenas de vida cotidiana citadina. Se a cena for interior, preferir masmorra, gruta, ruína isolada ou claustro abandonado — não salão de palácio em plena corte próspera, salvo se o texto o exigir de forma inequívoca.

- Preferir **Wikimedia Commons** (domínio público / CC) ou outra fonte com licença clara.
- Usa a API do Commons ou pesquisa web para obter um URL de descarga directo (JPEG/PNG); as *keywords* de pesquisa devem refletir o tom acima (ex.: “medieval fantasy dark”, “ruins mist”, “dungeon”, “gothic landscape wilderness” — sempre filtrando o que não entra na lista de evitar).
- Grava temporariamente (ex.: `/tmp/<nome>.jpg`) com `curl -sL "<url>" -o ...`.

## 3. Conversão (defaults = painel **Conversão** em `devToolsBrailleAscii.ts`)

| Parâmetro | Valor |
|-----------|--------|
| Largura (cols) | **160** |
| Dither | **atkinson** |
| Limiar | **127** |
| Inverter tons | **sim** |

O CLI `scripts/braille-from-image.ts` já usa estes defaults. Gerar para o ficheiro final:

```bash
npx tsx scripts/braille-from-image.ts /caminho/para/imagem.jpg \
  -o src/campaigns/<campaignId>/ascii/scenes/<pasta>/<artKey>.txt
```

- O nome do ficheiro tem de ser **`artKey.txt`** (basename = chave em `ascii/art.ts`).
- Coloca o `.txt` numa subpasta de `ascii/scenes/` coerente com o acto (ex.: `act4/`, `act6/`), como as outras artes da campanha.
- Só passa `-w`, `--dither`, `--threshold`, `--no-invert` se houver motivo para desviar dos defaults.

## 4. Verificação

- `npm run check:ascii-art` → deve terminar com `OK` (nenhuma arte pendente).
- Opcional: `npm test`.

## Restrições do projecto

- Narrativa e tom: **português brasileiro**, Calvário Subterrâneo; a imagem de referência segue o bloco **Tom visual** da secção 2 (medieval sombrio; sem cidade/civilização como foco).
- Não inventar `artKey` novos nas cenas sem alinhar ao schema; só preencher o que o check aponta ou o utilizador indicar.
- Regra interna de cenas: não gerar arte ASCII “criativa” só para placeholders de cena nova — **este comando aplica-se** quando o objectivo é **fechar pendências** de `artKey` ou substituir arte vazia.
