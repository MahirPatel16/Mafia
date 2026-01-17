# Troubleshooting Guide

## Issue: "Nothing happens when I click Join Game"

### Step 1: Check Browser Console
1. Open your website
2. Press `F12` or right-click → "Inspect"
3. Go to the "Console" tab
4. Look for any red error messages
5. Take a screenshot or copy the error messages

### Step 2: Verify Firebase Realtime Database is Enabled
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`mafia-f73d5`)
3. Click "Build" → "Realtime Database" in the left sidebar
4. If you see "Get started", click it and create a database
5. Choose a location (closest to you)
6. **IMPORTANT**: Choose "Start in test mode"

### Step 3: Check Database Rules
1. In Firebase Console → Realtime Database → Rules tab
2. Make sure rules look like this:
```json
{
  "rules": {
    "games": {
      ".read": true,
      ".write": true
    }
  }
}
```
3. Click "Publish" if you made changes

### Step 4: Test Firebase Connection
1. Open browser console (F12)
2. You should see: "Firebase initialized successfully"
3. If you see an error, check your `firebase-config.js` file

### Common Errors:

**Error: "Permission denied"**
- Solution: Update database rules (Step 3 above)

**Error: "Failed to fetch" or Network error**
- Solution: Check if Realtime Database is enabled (Step 2)

**Error: "Firebase: Error (auth/...)**
- Solution: Check your Firebase config values in `firebase-config.js`

**No error but nothing happens**
- Check console for any warnings
- Make sure JavaScript is enabled in your browser
- Try a different browser (Chrome, Firefox, Edge)

## GitHub Pages Workflow

### Yes, you need to commit and push changes

**Every time you make changes:**

1. **Save your files locally**

2. **Commit changes to Git:**
   ```bash
   git add .
   git commit -m "Description of changes"
   git push origin main
   ```

3. **Wait 1-2 minutes** for GitHub Pages to rebuild

4. **Refresh your website** (hard refresh: Ctrl+F5 or Cmd+Shift+R)

### Faster Development Workflow

**Option 1: Test Locally First**
- Use a local server to test before pushing:
  ```bash
  # Python 3
  python -m http.server 8000
  
  # Or Node.js
  npx http-server
  ```
- Then open `http://localhost:8000` in your browser
- Only push to GitHub when everything works

**Option 2: Use Firebase Hosting (Faster Updates)**
- Firebase Hosting updates instantly (no 1-2 min wait)
- See README.md for Firebase Hosting setup

### Quick Git Commands Reference

```bash
# Check what files changed
git status

# Add all changes
git add .

# Commit with message
git commit -m "Fixed join game button"

# Push to GitHub
git push origin main

# If you're on a different branch
git push origin YOUR_BRANCH_NAME
```

## Still Not Working?

1. **Check the browser console** for specific error messages
2. **Verify Firebase config** matches your project exactly
3. **Test in incognito/private mode** (rules out browser cache issues)
4. **Check Firebase Console** → Realtime Database → Data tab to see if data is being written
5. **Share the console error** if you need more help

