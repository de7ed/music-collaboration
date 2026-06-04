#!/bin/bash
unset NODE_OPTIONS
export PATH="/opt/homebrew/opt/node@20/bin:$PATH"
exec node node_modules/next/dist/bin/next dev --port "${PORT:-3000}"
