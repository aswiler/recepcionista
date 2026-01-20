#!/bin/bash

echo "🔍 Testing pnpm install setup..."
echo ""

# Check current directory
echo "Current directory:"
pwd
echo ""

# Check if we're in the right place
if [ ! -f "package.json" ]; then
  echo "❌ ERROR: package.json not found!"
  echo "   Make sure you're in: /Users/andrew/Downloads/Recepcionista.com/v2"
  exit 1
fi

echo "✅ Found package.json"
echo ""

# Check pnpm
echo "Checking pnpm:"
which pnpm
pnpm --version
echo ""

# Check workspace config
echo "Checking workspace:"
cat pnpm-workspace.yaml
echo ""

# Check apps exist
echo "Checking apps:"
ls -d apps/*/ 2>/dev/null || echo "⚠️  No apps found"
echo ""

# Try dry run first
echo "Running pnpm install (dry-run to see what would happen)..."
echo "---"
pnpm install --dry-run 2>&1 | head -20
echo "---"
echo ""

# If dry-run works, try real install
echo "Ready to install? Run:"
echo "  pnpm install"
echo ""
echo "Or with verbose output:"
echo "  pnpm install --loglevel=debug"
