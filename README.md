# Mafia Game - God's Controller

A real-time web-based Mafia game controller using Firebase. Players can join games, get automatically assigned roles, and play through night/day phases with voting.

## Features

- ✅ Player name entry and game code system
- ✅ Automatic role assignment (Killer, Doctor, Detective, Villagers)
- ✅ Automatic god selection (random player)
- ✅ Night phase with actions (Killer kills, Doctor heals, Detective investigates)
- ✅ Day phase with voting system
- ✅ Real-time game state updates
- ✅ Win condition detection
- ✅ Beautiful, modern UI
- ✅ Responsive design

## Setup Instructions

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or "Create a project"
3. Enter a project name (e.g., "mafia-game")
4. Disable Google Analytics (optional, to keep it simple)
5. Click "Create project"
6. Wait for project creation to complete

### Step 2: Enable Realtime Database

1. In your Firebase project, click on "Build" → "Realtime Database" in the left sidebar
2. Click "Create Database"
3. Choose a location (select the closest to you)
4. **IMPORTANT**: Choose "Start in test mode" (for development)
   - This allows read/write access. For production, you'll need to set up proper security rules later.
5. Click "Enable"

### Step 3: Get Firebase Configuration

1. In Firebase Console, click the gear icon ⚙️ next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps" section
4. Click the web icon `</>` to add a web app
5. Register your app with a nickname (e.g., "Mafia Game")
6. **Do NOT** check "Also set up Firebase Hosting" (we'll use GitHub Pages)
7. Click "Register app"
8. Copy the `firebaseConfig` object that appears

### Step 4: Configure Firebase in Your Code

1. Open `firebase-config.js` in your code editor
2. Replace the placeholder values with your actual Firebase config:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_ACTUAL_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

### Step 5: Host on GitHub Pages

#### Option A: Using GitHub Repository

1. Create a new repository on GitHub (e.g., "mafia-game")
2. Upload all files to the repository:
   - `index.html`
   - `styles.css`
   - `app.js`
   - `firebase-config.js`
3. Go to repository Settings → Pages
4. Under "Source", select "Deploy from a branch"
5. Choose "main" branch and "/ (root)" folder
6. Click "Save"
7. Your site will be available at: `https://YOUR_USERNAME.github.io/mafia-game/`

#### Option B: Using Firebase Hosting (Alternative)

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize Firebase in your project folder:
   ```bash
   firebase init hosting
   ```
   - Select your Firebase project
   - Public directory: `.` (current directory)
   - Single-page app: No
   - Overwrite index.html: No (if it exists)

4. Deploy:
   ```bash
   firebase deploy --only hosting
   ```

5. Your site will be available at: `https://YOUR_PROJECT_ID.web.app`

### Step 6: Update Database Security Rules (Important!)

1. In Firebase Console, go to Realtime Database → Rules
2. For development/testing, you can use these rules (allows read/write):
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
3. Click "Publish"

**Note**: These rules allow anyone to read/write. For production, you should implement proper authentication and security rules.

## How to Play

1. **Create/Join Game**:
   - Enter your name and click "Join Game"
   - If creating a new game, you'll get a game code
   - Share the game code with friends (they add `?code=XXXXXX` to the URL)

2. **Lobby**:
   - Wait for all players to join (3-10 players)
   - Click "Ready" when you're ready
   - Game starts automatically when everyone is ready

3. **Role Assignment**:
   - Roles are automatically assigned
   - One random player becomes the "God" (can see all roles)

4. **Night Phase**:
   - Killer: Choose someone to kill
   - Doctor: Choose someone to heal
   - Detective: Choose someone to investigate
   - God can see all actions and proceed to day phase

5. **Day Phase**:
   - See night results
   - Vote to eliminate a player
   - God can proceed when all votes are in

6. **Win Conditions**:
   - Villagers win if all Killers are eliminated
   - Killer wins if Killers equal or outnumber Villagers

## File Structure

```
Mafia/
├── index.html          # Main HTML structure
├── styles.css          # Styling
├── app.js              # Game logic and Firebase integration
├── firebase-config.js  # Firebase configuration
└── README.md           # This file
```

## Troubleshooting

### Firebase connection errors
- Make sure you've copied the correct Firebase config
- Check that Realtime Database is enabled
- Verify database rules allow read/write

### Game not starting
- Ensure at least 3 players have joined
- Make sure all players clicked "Ready"
- Check browser console for errors

### Real-time updates not working
- Check Firebase console for database activity
- Verify you're using the correct game code
- Make sure all players are on the same game code

## Notes

- The game uses Firebase Realtime Database for real-time synchronization
- Maximum 10 players per game
- Minimum 3 players required to start
- Game state persists in Firebase until manually cleared
- Old games can be cleaned up from Firebase Console if needed

## Future Enhancements

- Add authentication for better security
- Implement proper database security rules
- Add game history
- Add chat functionality
- Add sound effects
- Add animations

