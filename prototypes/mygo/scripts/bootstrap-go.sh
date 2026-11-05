#!/usr/bin/env bash
set -euo pipefail

version="1.27.1"
archive="go${version}.linux-amd64.tar.gz"
url="https://go.dev/dl/${archive}"
# SHA-256 published in Go's official download metadata.
sha256="63d339f0da5ab53635a56f2490a7984dfe12dfcff22ad749f63edaf590168445"
cache_dir="${HOME:?HOME must be set}/.cache/clay-mygo"
install_dir="$cache_dir/go$version"
go_bin="$install_dir/bin/go"

case "$(uname -s):$(uname -m)" in
  Linux:x86_64|Linux:amd64) ;;
  *)
    printf 'This bootstrap supports Linux/amd64. Install Go %s from %s, then set GO_BIN to its executable when running the prototype scripts.\n' "$version" 'https://go.dev/dl/' >&2
    exit 1
    ;;
esac

if [[ -x "$go_bin" ]] && [[ "$("$go_bin" version 2>/dev/null || true)" == "go version go$version linux/amd64" ]]; then
  printf 'Go %s is ready: %s\n' "$version" "$go_bin"
  printf 'Use it with prototype scripts via GO_BIN=%s ./scripts/build.sh\n' "$go_bin"
  exit 0
fi

for tool in curl sha256sum tar; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    printf 'Required command not found: %s\n' "$tool" >&2
    exit 1
  fi
done

mkdir -p "$cache_dir"
work_dir="$(mktemp -d "$cache_dir/.bootstrap-go.XXXXXX")"
trap 'rm -rf "$work_dir"' EXIT

curl -fL --retry 3 -o "$work_dir/$archive" "$url"
if ! (cd "$work_dir" && printf '%s  %s\n' "$sha256" "$archive" | sha256sum --check --status); then
  printf 'Checksum verification failed for %s\n' "$url" >&2
  exit 1
fi

tar -xzf "$work_dir/$archive" -C "$work_dir"
if [[ "$("$work_dir/go/bin/go" version 2>/dev/null || true)" != "go version go$version linux/amd64" ]]; then
  printf 'Downloaded archive did not contain Go %s for linux/amd64\n' "$version" >&2
  exit 1
fi

rm -rf "$install_dir"
mv "$work_dir/go" "$install_dir"
printf 'Installed Go %s: %s\n' "$version" "$go_bin"
printf 'Use it with prototype scripts via GO_BIN=%s ./scripts/build.sh\n' "$go_bin"
