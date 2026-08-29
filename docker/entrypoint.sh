#!/bin/sh
set -e

cd /app

port="${CLAY_PORT:-3000}"
title="${CLAY_TITLE:-}"

if [ $# -eq 0 ]; then
  set -- .
fi

if [ "$CLAY_APP" = "1" ] || [ "$CLAY_APP" = "true" ]; then
  set -- "$@" --app
fi

if [ -n "$title" ]; then
  exec bunx clay "$@" --no-open -p "$port" -t "$title"
fi

exec bunx clay "$@" --no-open -p "$port"
