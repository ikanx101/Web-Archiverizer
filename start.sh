#!/bin/bash
# start.sh — Webpage Archiverizer launcher
# Mulai aplikasi di background via nohup, simpan PID dan log.

PORT=3000

# Cek apakah port sudah dipakai
PID=$(lsof -ti:$PORT 2>/dev/null)
if [ -n "$PID" ]; then
    echo "⚠️  Web Archiverizer sudah jalan di port $PORT (PID: $PID)"
    echo "   Gunakan ./stop.sh untuk menghentikannya."
    exit 1
fi

echo "🚀 Menjalankan Webpage Archiverizer di port $PORT..."
nohup npx tsx server.ts > .archiver.log 2>&1 &
echo $! > .archiver.pid
echo "✅ PID: $! — Log: .archiver.log"
echo "   Buka http://localhost:$PORT"
