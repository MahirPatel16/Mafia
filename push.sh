#!/bin/bash
# Quick script to push changes to GitHub
# Usage: ./push.sh "your commit message"

cd "$(dirname "$0")"

if [ -z "$1" ]; then
    echo "Usage: ./push.sh 'your commit message'"
    exit 1
fi

echo "Adding all changes..."
git add .

echo "Committing with message: $1"
git commit -m "$1"

echo "Pushing to GitHub..."
git push origin main

echo "✅ Done! Changes pushed to GitHub."
echo "⏳ Wait 1-2 minutes for GitHub Pages to update."

