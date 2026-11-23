#!/bin/bash
# Double-click this file on a Mac to start the Ex-Eraser Photo App print demo.
# It opens the demo in your browser. Close this window to stop the demo.

cd "$(dirname "$0")" || exit 1

if ! command -v node >/dev/null 2>&1; then
  echo ""
  echo "The demo needs Node.js, which isn't installed yet."
  echo "Opening nodejs.org so you can download it. Install the LTS version,"
  echo "then double-click Start Demo again."
  echo ""
  open "https://nodejs.org"
  read -r -p "Press Return to close this window."
  exit 1
fi

PORT=3000
while lsof -i ":$PORT" >/dev/null 2>&1; do
  PORT=$((PORT + 1))
done

echo ""
echo "Starting the Ex-Eraser Photo App print demo..."
echo "It will open in your browser at http://localhost:$PORT"
echo "To stop the demo, close this window or press Control + C."
echo ""

(sleep 1 && open "http://localhost:$PORT") &
PORT=$PORT node server.js
