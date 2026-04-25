#!/usr/bin/env bash
# Empacota o jogo para itch.io (HTML): ZIP com index.html na raiz, ou envia com butler.
#
# Requisitos:
#   - Node + dependências (npm ci ou npm install)
#
# Upload manual (ZIP):
#   npm run release:itch
#   → cria release/silent-dungeon-itch.zip — envia em itch.io → Edit game → Uploads
#
# Upload com butler (só o que mudou; patches para a app itch):
#   1. Instala: https://itch.io/docs/butler/
#   2. API key: itch.io → Edit account → API keys → Generate
#   3. export BUTLER_API_KEY=...
#   4. npm run release:itch:push -- <utilizador-itch> <slug-do-jogo>
#      ou: ITCH_USER=... ITCH_GAME=... npm run release:itch:push
#
# Canal predefinido do butler para jogos no browser: "html"

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

ZIP_BASENAME="${ZIP_BASENAME:-silent-dungeon-itch.zip}"
RELEASE_DIR="${RELEASE_DIR:-$ROOT/release}"
BUTLER_CHANNEL="${BUTLER_CHANNEL:-html}"

DO_PUSH=false
SKIP_ZIP=false

usage() {
  echo "Uso: $(basename "$0") [opções] [--] [<itch-user> <game-slug>]"
  echo "  --push              Envia dist/ com butler (precisa BUTLER_API_KEY e user/slug)"
  echo "  --no-zip            Só build (e --push se combinado); não gera ZIP"
  echo "  -h, --help          Esta ajuda"
  echo
  echo "Argumentos posicionais (apenas com --push, se ITCH_USER/ITCH_GAME não estiverem definidos):"
  echo "  <itch-user> <game-slug>"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --push) DO_PUSH=true ;;
    --no-zip) SKIP_ZIP=true ;;
    -h|--help) usage; exit 0 ;;
    --)
      shift
      break
      ;;
    -*)
      echo "Opção desconhecida: $1" >&2
      usage >&2
      exit 1
      ;;
    *)
      break
      ;;
  esac
  shift
done

ITCH_USER="${ITCH_USER:-${1:-}}"
ITCH_GAME="${ITCH_GAME:-${2:-}}"

if [[ "$DO_PUSH" == true ]]; then
  if [[ -z "$ITCH_USER" || -z "$ITCH_GAME" ]]; then
    echo "Com --push, define ITCH_USER e ITCH_GAME ou passa: <utilizador> <slug>" >&2
    exit 1
  fi
  if [[ -z "${BUTLER_API_KEY:-}" ]]; then
    echo "Com --push, define a variável de ambiente BUTLER_API_KEY (itch.io → API keys)." >&2
    exit 1
  fi
fi

echo "→ npm run build"
npm run build

if [[ ! -f dist/index.html ]]; then
  echo "Erro: dist/index.html não existe após o build." >&2
  exit 1
fi

if grep -qE 'src="/src/main\.ts"|src="/src/main"' dist/index.html; then
  echo "Erro: dist/index.html ainda referencia a entrada de desenvolvimento — verifique vite.config e o build." >&2
  exit 1
fi

if [[ "$SKIP_ZIP" == false ]]; then
  mkdir -p "$RELEASE_DIR"
  ZIP_PATH="$RELEASE_DIR/$ZIP_BASENAME"
  echo "→ ZIP (index.html na raiz do arquivo): $ZIP_PATH"
  rm -f "$ZIP_PATH"
  (cd dist && zip -q -r "$ZIP_PATH" .)
  echo "   $(wc -c < "$ZIP_PATH" | tr -d ' ') bytes"
fi

if [[ "$DO_PUSH" == true ]]; then
  if ! command -v butler >/dev/null 2>&1; then
    echo "Erro: butler não está no PATH. Instalação: https://itch.io/docs/butler/" >&2
    exit 1
  fi
  TARGET="${ITCH_USER}/${ITCH_GAME}:${BUTLER_CHANNEL}"
  echo "→ butler push dist $TARGET"
  butler push dist "$TARGET"
  echo "Feito. No itch.io, confirma que o projeto está como 'HTML' e que o ficheiro/canal correto está ligado a 'Play in browser'."
fi

echo "OK."
