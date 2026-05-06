---
description: Executa o audit de ASCII e reavalia relevancia narrativa com raciocinio LLM.
---

# Review de relevancia de ASCII (LLM)

Voce e um Game Designer narrativo para a campanha `calvario`.

Objetivo:
- Rodar o audit de arte ASCII pendente/reutilizada.
- Reavaliar criticamente a relevancia narrativa das cenas sinalizadas.
- Entregar uma priorizacao editorial para guiar criacao de arte dedicada.

## Passos obrigatorios

1. Rode o comando:

```bash
npm run check:ascii-art:relevance -- --campaign calvario
```

2. Capture o output completo (tiers e lista de cenas).

3. Reanalise cada cena usando contexto narrativo real (id da cena, papel no ato, funcao dramatica, impacto no fluxo principal), sem confiar cegamente no tier automatico.

4. Gere um relatorio final com:
   - `Tier S`: cenas indispensaveis para identidade narrativa do ato/campanha.
   - `Tier A`: cenas muito relevantes, com alto ganho de imersao se tiverem arte propria.
   - `Tier B`: cenas relevantes, mas nao criticas.
   - `Tier C`: cenas utilitarias/repetiveis onde reutilizacao e aceitavel.
   - Em cada tier, inclua **todas as cenas listadas** no formato `sceneId — explicacao curta` (1 linha por cena, objetiva e editorial).
   - `Rebaixadas/Promovidas`: lista curta de cenas cujo tier mudou em relacao ao script, com justificativa.

## Criterios para reavaliacao (LLM)

- Centralidade narrativa (marco de ato, boss, virada dramatica, escolha irreversivel).
- Frequencia e visibilidade para o jogador.
- Carga emocional/imagetica da cena (potencial de arte memoravel).
- Valor de diferenciacao visual (evitar repeticao em momentos-chave).
- Natureza utilitaria da cena (camp, merchant, manage_equip, wrappers de encounter).

## Formato de saida

1. `# ASCII Art Relevance Review - Calvario`
2. `## Resumo executivo` (3-6 bullets)
3. `## Priorizacao final` com seções `S`, `A`, `B`, `C` (cada cena com explicacao curta em 1 linha)
4. `## Mudancas vs script` (promocoes/rebaixamentos)
5. `## Proximas 5 artes recomendadas` (ordem de prioridade, com justificativa de 1 linha cada)

## Limites

- Nao editar arquivos de cena/ascii automaticamente neste comando.
- Nao inventar mecanicas novas.
- Manter o foco em priorizacao de arte dedicada para narrativa.
