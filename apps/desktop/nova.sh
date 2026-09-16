#!/bin/bash
# NOVA Desktop Launcher
# Double-click this or run from terminal to start NOVA
cd "$(dirname "$0")"
ELECTRON="./node_modules/.bin/electron"

if [ ! -f "$ELECTRON" ]; then
  echo "Error: Run 'npm install' in this folder first"
  exit 1
fi

DISPLAY=${DISPLAY:-:0} exec "$ELECTRON" . \
  --no-sandbox \
  --disable-gpu \
  --disable-software-rasterizer \
  --in-process-gpu \
  --disable-dev-shm-usage \
  "$@"
