# Git Setup Instructions

## Option 1: Connect to Existing GitHub Repository

If you already have a GitHub repository:

1. **Get your repository URL:**
   - Go to your GitHub repo page
   - Click the green "Code" button
   - Copy the HTTPS or SSH URL
   - Example: `https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git`

2. **Add the remote and push:**
   ```bash
   cd /Users/mahirpatel/Documents/webdev/Mafia
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git branch -M main
   git push -u origin main
   ```

## Option 2: Create New GitHub Repository

1. **Go to GitHub:**
   - Visit https://github.com/new
   - Repository name: `mafia-game` (or any name you prefer)
   - Description: "Mafia Game - God's Controller"
   - Choose Public or Private
   - **DO NOT** initialize with README, .gitignore, or license (we already have files)
   - Click "Create repository"

2. **Connect and push:**
   ```bash
   cd /Users/mahirpatel/Documents/webdev/Mafia
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git branch -M main
   git push -u origin main
   ```

## After Setup - Daily Workflow

Once connected, here's how to commit and push changes:

```bash
cd /Users/mahirpatel/Documents/webdev/Mafia

# Check what changed
git status

# Add all changes
git add .

# Commit with a message
git commit -m "Description of your changes"

# Push to GitHub
git push origin main
```

## Enable GitHub Pages

After pushing to GitHub:

1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Under "Source", select **Deploy from a branch**
4. Branch: **main**
5. Folder: **/ (root)**
6. Click **Save**
7. Your site will be at: `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`

## Troubleshooting

**If you get "remote origin already exists":**
```bash
git remote remove origin
git remote add origin YOUR_REPO_URL
```

**If you get authentication errors:**
- Use GitHub Personal Access Token instead of password
- Or set up SSH keys: https://docs.github.com/en/authentication/connecting-to-github-with-ssh

**To check your remote:**
```bash
git remote -v
```

