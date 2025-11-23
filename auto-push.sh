#!/bin/bash

# Auto-commit and push script for Mini Militia Game
# Usage: ./auto-push.sh "Your commit message"

COMMIT_MSG=${1:-"Auto-update: $(date '+%Y-%m-%d %H:%M:%S')"}

echo "🔄 Auto-committing and pushing changes..."

# Add all changes
git add .

# Commit with message
git commit -m "$COMMIT_MSG"

# Push to GitHub (triggers Vercel auto-deploy)
git push origin main 2>/dev/null || git push origin master

echo "✅ Changes pushed to GitHub!"
echo "🚀 Vercel will auto-deploy in a few seconds..."
echo ""
echo "Check deployment at: https://vercel.com/harrybarzs-projects"

