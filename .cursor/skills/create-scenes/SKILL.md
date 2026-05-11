---
name: criar-cenas-calvario
description: Use quando o usuário pedir para criar, expandir, revisar ou iterar cenas da campanha calvario em Markdown, com frontmatter YAML válido, IDs por ato e escolhas conectadas.
---

# Criar Cenas — A Masmorra do Silêncio

## Objetivo

Gerar cenas `.md` prontas para `src/campaigns/calvario/scenes/...`, válidas no schema e consistentes com o tom da campanha.

## Fluxo curto

1. Entender briefing (ato, objetivo, consequência).
2. Definir `id` e caminho (`actN/...`) em inglês.
3. Escrever frontmatter + corpo narrativo em PT-BR.
4. Revisar conexões, requisitos, efeitos e tom.
5. Sugerir validação (`validate:scenes` e `validate:unreachable`).

## Regras obrigatórias

- Entregar um único arquivo `.md` com frontmatter YAML válido.
- `id` deve bater com caminho relativo em `scenes/` (sem `.md`).
- `chapter` coerente com o ato (`act6/*` -> `chapter: 6`).
- `choices[].next` usa ID de cena, nunca path de arquivo.
- Não criar campos fora do schema.
- IDs/paths/nomes técnicos em inglês; texto do jogador em português brasileiro.

## Recursos e limites

- `supply`: 0-10
- `faith`: 0-5
- `corruption`: 0-10
- `gold`: 0-999
- Em `addResource`, usar deltas curtos e coerentes com risco/recompensa.

## Campos de cena (além de `choices`)

- **Base:** `id`, `title`, `chapter`, `type`, `ambientTheme`
- **Entrada:** `onEnter`, `repeatOnEnter`
- **Checks:** `skillCheck`, `dualAttrSkillCheck`, `luckCheck`
- **Ramo/gate:** `randomBranch`, `chapterGate`
- **Arte/UI:** `art`, `artKey`, `highlight`, `artHighlightFrames`, `highlightHoldMs`, `campCombatHint`
- **Combate:** `encounterId`, `onVictory`, `onFlee`, `onDefeat`, `interleaveAfterCombat`

### Overlay `highlight` com animação (ASCII)

- Com `highlight: true` e `artHighlightFrames` com **duas ou mais** chaves válidas em `sceneArt`, o overlay em tela cheia **cicla** esses ficheiros durante o hold.
- `highlightHoldMs` (opcional, 400–8000): duração total do hold em ms antes do fade (omissão = 1000). O tempo divide-se em partes iguais entre quadros.
- Sem `artHighlightFrames` ou com menos de duas chaves resolvidas: comportamento de um único quadro (`art` / `artKey`).
- Cada chave = basename de `ascii/scenes/**/*.txt`; convém o primeiro quadro coincidir com a arte do corpo da cena.
- Workflow de criação dos `.txt` de variação: comando Cursor `ascii-highlight-frames`. Novo ficheiro pode começar com `PLACEHOLDER` até arte final (`npm run check:ascii-art`).

## Campos de `choices`

- `text`, `next`, `condition`, `effects`
- `preview`, `uiSection`
- `timedMs`, `fallbackNext`, `fallbackEffects`
- `showWhenLocked`, `lockedHint`

## Requirements e hints

- Não há `requirements` no schema: use `condition`.
- Para mostrar opção bloqueada: `condition` + `showWhenLocked: true` + `lockedHint`.
- `preview` explica consequência; `lockedHint` explica bloqueio.

### Exemplo (bloqueada com hint)

```yaml
choices:
  - text: "[>] Abrir o relicário selado"
    condition: { resource: faith, gte: 3 }
    showWhenLocked: true
    lockedHint: "Requer Fé 3+."
    next: act3/relicario_aberto
```

### Exemplos rápidos de `condition`

```yaml
condition: { resource: supply, gte: 2 }
condition: { class: cleric }
condition: { rep: { faction: vigilia, gte: 1 } }
condition:
  all:
    - { flag: vigilia_oath }
    - { resource: faith, gte: 2 }
```

## Escolhas temporizadas

- `timedMs` exige `fallbackNext` ou `fallbackEffects`.
- Use para urgência real (emboscada, colapso, ritual).

```yaml
choices:
  - text: "[!] Saltar antes da ponte ruir"
    timedMs: 4500
    fallbackNext: act4/bridge_fall
    fallbackEffects:
      - { op: addResource, resource: corruption, delta: 1 }
    preview: "Se hesitar, a ponte cede."
    next: act4/bridge_jump
```

## Marcadores em `choices[].text` (opcional)

- `[#]` knight, `[*]` mage, `[+]` cleric
- `[!]` risco, `[@]` camp, `[>]` exploração, `[~]` descanso, `[%]` combate
- Com `startCombat`, a UI tende a enfatizar combate automaticamente.

## Qualidade narrativa

- Gancho forte na abertura.
- 2 a 4 escolhas relevantes.
- Pelo menos 1 trade-off claro.
- Continuidade com ato/campanha.
- Classes: `knight`, `mage`, `cleric`.
- Facções: `vigilia`, `circulo`, `culto`.

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

Quando o usuário pedir cena nova sem editar arquivo automaticamente:

1. `Caminho sugerido: ...`
2. Bloco Markdown completo da cena
3. `Checklist de validação` (5-8 itens)

## Checklist antes de finalizar

- `id` confere com o caminho sugerido/arquivo.
- Frontmatter YAML válido.
- `chapter` coerente com o ato.
- `choices` com destinos plausíveis.
- Sem campos fora do schema.
- Tom consistente com a campanha (português, fantasia sombria, masmorra e silêncio como fio condutor).
- Se aplicável, checks/effects/condições compatíveis com engine.
