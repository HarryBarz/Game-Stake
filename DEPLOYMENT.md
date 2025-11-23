# Auto-Deployment Setup Guide

## What's Configured

1. **Vite Build System**: Modern, fast build tool with hot reloading
2. **Vercel Auto-Deploy**: When you push to GitHub, Vercel automatically builds and deploys
3. **Auto-Push Script**: Easy script to commit and push changes
4. **Dynamic Development**: Hot module replacement for instant updates

## Development (Local)

### Start Development Server (with hot reloading)

```bash
npm run dev
```

This will:
- Start Vite dev server on http://localhost:8080
- Enable hot module replacement (instant updates)
- Auto-reload on file changes

## Quick Deploy

### Option 1: Use the Auto-Push Script (Recommended)

```bash
./auto-push.sh "Your commit message here"
```

This will:
- Add all changes
- Commit with your message
- Push to GitHub
- Vercel auto-builds and deploys

### Option 2: Manual Git Commands

```bash
git add .
git commit -m "Your message"
git push origin main
```

Vercel will automatically build and deploy after the push!

## Setup Vercel GitHub Integration

1. **In Vercel Dashboard:**
   - Go to your project settings
   - Go to "Git" section
   - Make sure GitHub is connected
   - Enable "Automatic deployments from Git"

2. **That's it!** Every push to `main` branch will auto-deploy.

## Workflow

```
Make Changes → Run ./auto-push.sh → GitHub → Vercel Auto-Deploys
```

## Example

```bash
# Make your changes to files
# Then run:
./auto-push.sh "Added new staking feature"

# Wait ~30 seconds
# Check: https://your-project.vercel.app
```

## Advanced: Enable Auto-Push Hook

If you want EVERY commit to auto-push:

1. Edit `.git/hooks/post-commit`
2. Uncomment the lines
3. Now every `git commit` will auto-push!

**Note**: This can be annoying if you commit frequently. Use the script instead.
