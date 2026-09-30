#!/bin/sh
set -eu
cd /workspace
if curl -fsS -o /dev/null --max-time 1 http://127.0.0.1:8080/; then
  exit 0
fi
nohup npm run dev > /tmp/nakano-dev.log 2>&1 &
exit 0
