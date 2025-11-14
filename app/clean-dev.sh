#!/bin/bash
# Clean script to remove Next.js lock files and kill processes

echo "Cleaning Next.js development environment..."

# Kill all Next.js processes
echo "Killing Next.js processes..."
pkill -f "next dev" 2>/dev/null
pkill -f "node.*next" 2>/dev/null

# Kill processes on ports 3000-3002
echo "Killing processes on ports 3000-3002..."
lsof -ti:3000,3001,3002 2>/dev/null | xargs kill -9 2>/dev/null

# Remove lock files
echo "Removing lock files..."
rm -rf .next/dev/lock .next/dev 2>/dev/null

echo "Cleanup complete! You can now run 'bun run dev'"

