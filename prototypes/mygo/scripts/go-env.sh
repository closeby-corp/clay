#!/usr/bin/env bash
set -euo pipefail

handoff="/tmp/clay-mygo-toolchain.json"
toolchain_values=()
selected_go=""

if [[ -n "${GO_BIN:-}" ]]; then
  if [[ -x "$GO_BIN" ]]; then
    selected_go="$GO_BIN"
  else
    printf 'Ignoring GO_BIN because it is not executable: %s\n' "$GO_BIN" >&2
  fi
fi

if [[ -z "$selected_go" && -r "$handoff" ]] && command -v python3 >/dev/null 2>&1; then
  if handoff_values="$(python3 - "$handoff" 2>/dev/null <<'PY'
import json
import sys

try:
    with open(sys.argv[1], encoding="utf-8") as f:
        data = json.load(f)
    toolchain = data.get("toolchain", {})
    if not isinstance(toolchain, dict):
        raise ValueError("invalid toolchain entry")
    for key in ("executable", "module_cache", "build_cache"):
        value = toolchain.get(key, "")
        print(value if isinstance(value, str) else "")
except (OSError, ValueError, AttributeError):
    sys.exit(1)
PY
  )"; then
    mapfile -t toolchain_values <<< "$handoff_values"
    if [[ -n "${toolchain_values[0]:-}" && -x "${toolchain_values[0]}" ]]; then
      selected_go="${toolchain_values[0]}"
    else
      toolchain_values=()
    fi
  fi
fi

if [[ -z "$selected_go" && -n "${HOME:-}" ]]; then
  cached_go="$HOME/.cache/clay-mygo/go1.27.1/bin/go"
  if [[ -x "$cached_go" && "$("$cached_go" version 2>/dev/null || true)" == "go version go1.27.1 "* ]]; then
    selected_go="$cached_go"
  fi
fi

if [[ -z "$selected_go" ]]; then
  selected_go="$(type -P go || true)"
fi
if [[ -z "$selected_go" || ! -x "$selected_go" ]]; then
  printf 'Go is unavailable. Install Go 1.27.1 or set GO_BIN to its executable.\n' >&2
  return 1 2>/dev/null || exit 1
fi

GO_BIN="$selected_go"
if [[ "${toolchain_values[0]:-}" == "$selected_go" && -z "${GOMODCACHE:-}" && -d "${toolchain_values[1]:-}" ]]; then
  export GOMODCACHE="${toolchain_values[1]}"
fi
if [[ "${toolchain_values[0]:-}" == "$selected_go" && -z "${GOCACHE:-}" && -d "${toolchain_values[2]:-}" ]]; then
  export GOCACHE="${toolchain_values[2]}"
fi
export GO_BIN
export GOWORK=off
