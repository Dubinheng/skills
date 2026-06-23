#!/bin/bash
# 一键同步到 GitHub: ./sync.sh "更新说明"
MSG="${1:-update skills}"
cd "$(dirname "$0")"
git add .
git commit -m "$MSG" 2>/dev/null && git push || echo "没有新变更需要同步"
