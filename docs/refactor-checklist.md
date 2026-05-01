# Checklist de Refactor Estrutural

Usar este checklist quando a mudança for de organização/manutenabilidade, sem intenção de alterar comportamento.

## Escopo do PR

- Objetivo técnico em 1 frase (`por que` da reorganização).
- Lista curta de áreas afetadas (`engine`, `ui`, `campaigns`, `tests`).
- Confirmação explícita: sem mudança funcional planejada.

## Tamanho e revisão

- Preferir 1 objetivo técnico por PR.
- Evitar misturar refactor com feature/balance/narrativa.
- Manter diff revisável (arquivos e blocos coesos).

## Validação obrigatória

- `npm run check:engine-boundaries`
- `npm run test`

## Validação adicional (quando tocar campanha/cenas)

- `npm run validate:scenes -- --campaign <id>`
- `npm run validate:unreachable -- --campaign <id>`
- `npm run check:ascii-art -- --campaign <id>`

## Evidência no PR

- Comandos executados e resultado (pass/fail).
- Principais riscos avaliados (acoplamento, regressão de fluxo).
- O que ficou fora do escopo para próximo PR.
