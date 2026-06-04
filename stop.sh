#!/bin/bash
# stop.sh — Webpage Archiverizer stopper
# Hentikan proses yang menggunakan port 3000.

PORT=3000
PID_FILE=".archiver.pid"
PID=$(lsof -ti:$PORT 2>/dev/null)

if [ -z "$PID" ]; then
    echo "⚠️  Tidak ada proses Web Archiverizer yang berjalan."
    rm -f "$PID_FILE"
    exit 0
fi

echo "🛑 Menghentikan Web Archiverizer (PID: $PID)..."
kill "$PID" 2>/dev/null
sleep 1

# Cek ulang, force kill jika masih berjalan
if lsof -ti:$PORT &>/dev/null; then
    echo "⚠️  Force kill..."
    kill -9 "$PID" 2>/dev/null
fi

rm -f "$PID_FILE"
echo "✅ Berhasil dihentikan."
