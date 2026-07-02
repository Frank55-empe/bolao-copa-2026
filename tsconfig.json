#!/bin/bash
# ============================================================
# Script de build e deploy para GitHub Pages
# Execute: bash DEPLOY.sh
# ============================================================
set -e

echo ""
echo "======================================"
echo "  BOLÃO MUNDIAL 2026 — Build & Deploy"
echo "======================================"
echo ""

# 1. Instalar dependências
echo "📦 Instalando dependências..."
npm install

# 2. Build
echo ""
echo "🔨 Fazendo build..."
npm run build

# 3. O plugin vite já copia config.js para dist/
# (veja vite.config.ts — função copyConfigJs)
echo ""
echo "✅ config.js copiado para dist/ automaticamente pelo Vite"

# 4. Deploy
echo ""
echo "🚀 Fazendo deploy no GitHub Pages..."
npm run deploy

echo ""
echo "======================================"
echo "  ✅ Deploy concluído!"
echo "  Acesse: https://Frank55-empe.github.io/bolao-copa-2026/"
echo "======================================"
