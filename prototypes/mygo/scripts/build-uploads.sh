#!/usr/bin/env bash
set -euo pipefail

prototype_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$prototype_dir/scripts/go-env.sh"
bin="$prototype_dir/bin"
dist="$prototype_dir/web/uploads-dist"

mkdir -p "$bin" "$dist"
cp "$prototype_dir/web/uploads.html" "$dist/index.html"
(
  cd "$prototype_dir"
  unset GOOS GOARCH
  build_flags=(-mod=readonly -trimpath '-ldflags=-s -w')
  CGO_ENABLED=0 "$GO_BIN" build "${build_flags[@]}" -o "$bin/clay-uploads" ./cmd/uploads
  GOOS=js GOARCH=wasm CGO_ENABLED=0 "$GO_BIN" build "${build_flags[@]}" -o "$dist/app.wasm" ./cmd/uploads
)
goroot="$("$GO_BIN" env GOROOT)"
cp "$goroot/lib/wasm/wasm_exec.js" "$dist/wasm_exec.js"
printf 'Built native uploads app: %s\n' "$bin/clay-uploads"
printf 'Built browser uploads app: %s\n' "$dist/app.wasm"
printf 'Built browser uploads assets: %s\n' "$dist"
