---
name: criar-cenas-calvario
description: Cria cenas Markdown jogáveis para A Masmorra do Silêncio (campanha calvario) com frontmatter YAML válido, IDs consistentes por ato, escolhas conectadas, checks/effects compatíveis com o schema e tom de fantasia sombria em português. Use quando o usuário pedir para criar, expandir, revisar ou iterar cenas da campanha (ex.: actX, choices, onEnter, skillCheck, luckCheck, randomBranch, combate narrativo).
---

# Criar Cenas — A Masmorra do Silêncio

## Objetivo
Gerar cenas prontas para salvar em `src/campaigns/calvario/scenes/...` sem quebrar validação de conteúdo.

## Fluxo rápido
1. Entender o briefing (ato, objetivo dramático, consequência desejada).
2. Definir `id` e caminho compatíveis (`actN/...`).
3. Montar frontmatter mínimo válido.
4. Escrever corpo narrativo em português (fantasia sombria).
5. Revisar continuidade, escolhas e efeitos.
6. Sugerir validação com `npm run validate:scenes -- --campaign calvario` e, se útil, `npm run validate:unreachable -- --campaign calvario`.

## Regras obrigatórias do arquivo de cena
- Entregar **um `.md`** com frontmatter YAML no topo.
- `id` deve bater com o caminho relativo em `scenes/` (sem `.md`).
- `chapter` coerente com o ato (`act6/*` => `chapter: 6`).
- `choices[].next` usa **IDs de cena**, nunca path de arquivo.
- Não inventar campos fora do schema.
- Idioma: português.

## Campos permitidos mais comuns
- Cena:
  - `id`, `title`, `chapter`, `type`, `ambientTheme`, `artKey`
  - `onEnter`, `choices`
  - `skillCheck`, `dualAttrSkillCheck`, `luckCheck`, `randomBranch`
  - `encounterId`, `onVictory`, `onFlee`, `onDefeat`, `interleaveAfterCombat`
- Em `choices`:
  - `text`, `next`, `condition`, `effects`, `preview`, `timedMs`, `fallbackNext`

### Marcadores opcionais no início de `choices[].text`
Prefixo **um carácter** dentro de `[]` seguido de espaço; a UI destaca o glifo e aplica tom discreto ao botão quando aplicável.

| Marcador | Uso |
|----------|-----|
| `[#]` | Escolha de classe cavaleiro (só destaque do símbolo) |
| `[*]` | Mago |
| `[+]` | Clérigo |
| `[!]` | Alerta / escolha arriscada (tom de perigo) |
| `[@]` | Acampamento / foco de camp |
| `[>]` | Exploração / avanço |
| `[~]` | Descanso / recuperação |
| `[%]` | Combate / encontro (opcional no texto; também injetado pela UI com `startCombat`) |

**Automático (sem mudar o texto):** escolhas com `startCombat` ganham tom de combate e o glifo `[%]` na UI; `campRest` mostra `[~]`; `setExploration` e movimentos no mapa de exploração mostram `[>]`. Se combinar `[!]` com combate, o tom de risco prevalece e o badge continua `[!]`. Se combate coexistir com `[~]` ou `[>]` no texto, o badge passa a `[%]`. Outros colchetes (ex. `[x]`) não são tratados como marcador e ficam no texto normal.

## Efeitos e condições (usar só padrões existentes)
- Efeitos comuns:
  - `setFlag`, `toggleFlag`, `addDiary`
  - `addResource` (`supply`, `faith`, `corruption`, `gold`)
  - `addMark`, `addRep`
  - `startCombat` (`encounterId`, `onVictory`, `onFlee`, `onDefeat`)
- Condições comuns:
  - `flag` / `noFlag`
  - `mark` / `noMark`
  - `resource` (`faith/corruption/supply/gold` com `gte/lte`)
  - `class`, `rep`, `all`, `any`, `not`

## Qualidade narrativa
- A cena deve ter:
  - gancho forte no início;
  - 2–4 escolhas relevantes;
  - ao menos 1 trade-off claro (benefício imediato vs risco futuro);
  - continuidade com ato/campanha.
- Classes para lembrar: `knight`, `mage`, `cleric`.
- Facções para lembrar: `vigilia`, `circulo`, `culto`.

## Template base
```markdown
---
id: actX/slug_da_cena
title: Título da Cena
chapter: X
ambientTheme: explore
choices:
  - text: "Escolha A"
    next: actX/proxima_cena
  - text: "Escolha B (com custo)"
    effects:
      - { op: addResource, resource: corruption, delta: 1 }
    next: actX/outra_cena
onEnter: []
---
Texto narrativo da cena em fantasia sombria.
```

## Formato de resposta recomendado
Quando o usuário pedir uma cena nova sem editar arquivo automaticamente:
1. `Caminho sugerido: ...`
2. Bloco de código Markdown com conteúdo completo da cena
3. `Checklist de validação:` com 5–8 itens

## Checklist antes de finalizar
- `id` confere com o caminho sugerido/arquivo.
- Frontmatter YAML válido.
- `chapter` coerente com o ato.
- `choices` com destinos plausíveis.
- Sem campos fora do schema.
- Tom consistente com a campanha (português, fantasia sombria, masmorra e silêncio como fio condutor).
- Se aplicável, checks/effects/condições compatíveis com engine.
