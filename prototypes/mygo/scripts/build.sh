#!/usr/bin/env bash
set -euo pipefail

prototype_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$prototype_dir/scripts/go-env.sh"
bin="$prototype_dir/bin"
dist="$prototype_dir/web/dist"

mkdir -p "$bin"
mkdir -p "$dist"
cp "$prototype_dir/web/index.html" "$dist/index.html"
(
  cd "$prototype_dir"
  unset GOOS GOARCH
  build_flags=(-mod=readonly -trimpath '-ldflags=-s -w')
  CGO_ENABLED=0 "$GO_BIN" build "${build_flags[@]}" -o "$bin/mygo" ./cmd/app
  CGO_ENABLED=0 "$GO_BIN" build "${build_flags[@]}" -o "$bin/mygo-api" ./cmd/api
  GOOS=js GOARCH=wasm CGO_ENABLED=0 "$GO_BIN" build "${build_flags[@]}" -o "$dist/app.wasm" ./cmd/app
)
goroot="$("$GO_BIN" env GOROOT)"
cp "$goroot/lib/wasm/wasm_exec.js" "$dist/wasm_exec.js"
printf 'Built native app: %s\n' "$bin/mygo"
printf 'Built API server: %s\n' "$bin/mygo-api"
printf 'Built browser app: %s\n' "$dist/app.wasm"
printf 'Built browser assets: %s\n' "$dist"
