#!/usr/bin/env bash
set -euo pipefail

prototype_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$prototype_dir/scripts/go-env.sh"
cd "$prototype_dir"
exec "$GO_BIN" test -mod=readonly "$@" ./...
