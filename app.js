import { database } from './firebase-config.js';
import { ref, set, onValue, update, push, remove, get } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

// Game state
let currentPlayerId = null;
const GLOBAL_GAME_ID = 'global'; // Single global game
let playerName = '';
let playerRole = '';
let isGod = false;
let isAdmin = false;

// DOM elements
const welcomeScreen = document.getElementById('welcomeScreen');
const lobbyScreen = document.getElementById('lobbyScreen');
const gameScreen = document.getElementById('gameScreen');
const playerNameInput = document.getElementById('playerName');
const joinGameBtn = document.getElementById('joinGameBtn');
const playersList = document.getElementById('playersList');
const playerCount = document.getElementById('playerCount');
const readyBtn = document.getElementById('readyBtn');
const leaveGameBtn = document.getElementById('leaveGameBtn');
const waitingMessage = document.getElementById('waitingMessage');
const currentPhase = document.getElementById('currentPhase');
const playerRoleSpan = document.getElementById('playerRole');
const roleDescription = document.getElementById('roleDescription');
const roleDisplay = document.getElementById('roleDisplay');
const godView = document.getElementById('godView');
const godInfo = document.getElementById('godInfo');
const godActions = document.getElementById('godActions');
const nightPhase = document.getElementById('nightPhase');
const nightActions = document.getElementById('nightActions');
const submitNightActionBtn = document.getElementById('submitNightActionBtn');
const dayPhase = document.getElementById('dayPhase');
const dayResults = document.getElementById('dayResults');
const votingSection = document.getElementById('votingSection');
const voteOptions = document.getElementById('voteOptions');
const submitVoteBtn = document.getElementById('submitVoteBtn');
const gameOver = document.getElementById('gameOver');
const gameResult = document.getElementById('gameResult');
const newGameBtn = document.getElementById('newGameBtn');
const playersStatus = document.getElementById('playersStatus');
const adminPanel = document.getElementById('adminPanel');
const killerCountInput = document.getElementById('killerCount');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const backgroundMusic = document.getElementById('backgroundMusic');
const nightAnnouncement = document.getElementById('nightAnnouncement');
const skipVoteBtn = document.getElementById('skipVoteBtn');
const godViewGameOver = document.getElementById('godViewGameOver');
const godInfoGameOver = document.getElementById('godInfoGameOver');
const homeBtn = document.getElementById('homeBtn');
const soundEveryoneClose = document.getElementById('soundEveryoneClose');
const soundKillerOpen = document.getElementById('soundKillerOpen');
const soundKillerClose = document.getElementById('soundKillerClose');
const soundHealerOpen = document.getElementById('soundHealerOpen');
const soundHealerClose = document.getElementById('soundHealerClose');
const soundDetectiveOpen = document.getElementById('soundDetectiveOpen');
const soundDetectiveClose = document.getElementById('soundDetectiveClose');
const soundEveryoneOpen = document.getElementById('soundEveryoneOpen');
const actionTimeInput = document.getElementById('actionTime');

// Initialize
async function init() {
    console.log('Initializing Mafia Game...');
    
    // Check if Firebase is connected
    if (!database) {
        console.error('Firebase database not initialized!');
        alert('Firebase connection error! Please check firebase-config.js');
        return;
    }
    console.log('Firebase connected successfully');

    // Verify all required DOM elements exist
    if (!joinGameBtn || !readyBtn || !leaveGameBtn || !submitNightActionBtn || !submitVoteBtn || !newGameBtn || !playerNameInput) {
        console.error('Some DOM elements are missing!');
        alert('Page not loaded correctly. Please refresh the page.');
        return;
    }

    // Set up event listeners (always needed)
    setupEventListeners();
    
    // Check for saved session
    const savedSession = getSavedSession();
    if (savedSession) {
        console.log('Found saved session, attempting to restore...');
        const restored = await restoreSession(savedSession);
        if (restored) {
            console.log('Session restored successfully');
            return;
        } else {
            console.log('Could not restore session, clearing saved data');
            clearSavedSession();
        }
    }
}

// Setup event listeners
function setupEventListeners() {
    // Event listeners
    joinGameBtn.addEventListener('click', handleJoinGame);
    if (forceResetBtn) {
        forceResetBtn.addEventListener('click', forceResetGame);
    }
    if (forceResetBtn) {
        forceResetBtn.addEventListener('click', forceResetGame);
    }
    readyBtn.addEventListener('click', toggleReady);
    leaveGameBtn.addEventListener('click', leaveGame);
    submitNightActionBtn.addEventListener('click', submitNightAction);
    submitVoteBtn.addEventListener('click', submitVote);
    newGameBtn.addEventListener('click', startNewGame);
    if (homeBtn) {
        homeBtn.addEventListener('click', goHome);
    }
    if (skipVoteBtn) {
        skipVoteBtn.addEventListener('click', skipVote);
    }
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', saveAdminSettings);
    }
    
    // Music controls - start music when game starts
    if (backgroundMusic) {
        backgroundMusic.volume = 0.3; // Set volume to 30%
    }

    playerNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleJoinGame();
        }
    });
    
    console.log('Event listeners set up');
}

// Save session to localStorage
function saveSession() {
    const session = {
        playerId: currentPlayerId,
        playerName: playerName,
        timestamp: Date.now()
    };
    localStorage.setItem('mafia_game_session', JSON.stringify(session));
    console.log('Session saved to localStorage');
}

// Get saved session from localStorage
function getSavedSession() {
    try {
        const saved = localStorage.getItem('mafia_game_session');
        if (!saved) return null;
        
        const session = JSON.parse(saved);
        // Check if session is not too old (24 hours)
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        if (Date.now() - session.timestamp > maxAge) {
            localStorage.removeItem('mafia_game_session');
            return null;
        }
        return session;
    } catch (e) {
        console.error('Error reading saved session:', e);
        return null;
    }
}

// Clear saved session
function clearSavedSession() {
    localStorage.removeItem('mafia_game_session');
    console.log('Session cleared from localStorage');
}

// Restore session from localStorage
async function restoreSession(savedSession) {
    try {
        currentPlayerId = savedSession.playerId;
        playerName = savedSession.playerName;
        
        // Check if player still exists in Firebase
        const playerRef = ref(database, `games/${GLOBAL_GAME_ID}/players/${currentPlayerId}`);
        const playerSnapshot = await get(playerRef);
        
        if (!playerSnapshot.exists()) {
            console.log('Player no longer exists in game');
            return false;
        }
        
        const gameRef = ref(database, `games/${GLOBAL_GAME_ID}`);
        const gameSnapshot = await get(gameRef);
        
        if (!gameSnapshot.exists()) {
            console.log('Game no longer exists');
            return false;
        }
        
        const game = gameSnapshot.val();
        
        // Check if player is admin
        isAdmin = game.admin === currentPlayerId;
        
        // Update player name input (hidden but useful for reference)
        if (playerNameInput) {
            playerNameInput.value = playerName;
        }
        
        // Listen to game changes
        listenToGame();
        
        // Show appropriate screen based on game status
        if (game.status === 'playing') {
            showScreen('game');
            updateGame(game);
        } else {
            showScreen('lobby');
            // Update lobby to show admin panel if needed
            updateLobby(game);
        }
        
        return true;
    } catch (error) {
        console.error('Error restoring session:', error);
        return false;
    }
}

// Force reset stuck game
async function forceResetGame() {
    if (!confirm('This will reset the game. Are you sure?')) {
        return;
    }
    
    try {
        const gameRef = ref(database, `games/${GLOBAL_GAME_ID}`);
        await update(gameRef, {
            status: 'lobby',
            phase: 'lobby',
            players: {},
            god: null,
            admin: null,
            nightActions: {},
            votes: {},
            nightStep: 'killer',
            detectiveResult: {},
            lastNightResult: '',
            lastDayResult: '',
            winner: null
        });
        alert('Game reset! You can now join.');
    } catch (error) {
        console.error('Error resetting game:', error);
        alert('Error resetting game: ' + error.message);
    }
}

// Join global game
async function handleJoinGame() {
    try {
        const name = playerNameInput.value.trim();
        if (!name) {
            alert('Please enter your name');
            return;
        }

        // Disable button to prevent double clicks
        joinGameBtn.disabled = true;
        joinGameBtn.textContent = 'Joining...';

        playerName = name;
        
        console.log('Joining global game');

        // Check if global game exists, create if not
        const gameRef = ref(database, `games/${GLOBAL_GAME_ID}`);
        const snapshot = await get(gameRef);
        
        if (!snapshot.exists()) {
            // Create global game
            await set(gameRef, {
                code: GLOBAL_GAME_ID,
                status: 'lobby',
                players: {},
                god: null,
                phase: 'lobby',
                createdAt: Date.now()
            });
            console.log('Created global game');
        } else {
            const game = snapshot.val();
            // Allow joining if game is over (gameover phase or finished status) or if there are no players
            const hasPlayers = game.players && Object.keys(game.players).length > 0;
            const isGameOver = game.phase === 'gameover' || game.status === 'finished';
            
            // Check if there are any alive players
            let hasAlivePlayers = false;
            if (hasPlayers) {
                const players = game.players || {};
                hasAlivePlayers = Object.values(players).some(p => p.alive === true);
            }
            
            // Check if game has been stuck for too long (more than 1 hour)
            const gameAge = game.createdAt ? Date.now() - game.createdAt : 0;
            const isStuck = gameAge > 60 * 60 * 1000; // 1 hour
            
            // Block joining only if game is actively playing AND has alive players AND not stuck
            if (game.status === 'playing' && !isGameOver && hasAlivePlayers && !isStuck) {
                alert('A game is currently in progress. Please wait for it to finish.');
                joinGameBtn.disabled = false;
                joinGameBtn.textContent = 'Join Game';
                return;
            }
            
            // If game is over, has no alive players, is stuck, or has no players, reset it to lobby
            if (isGameOver || !hasAlivePlayers || isStuck || !hasPlayers) {
                console.log('Resetting game to lobby. Reason:', {
                    isGameOver,
                    hasAlivePlayers,
                    isStuck,
                    hasPlayers
                });
                await update(gameRef, {
                    status: 'lobby',
                    phase: 'lobby',
                    players: {},
                    god: null,
                    admin: null,
                    nightActions: {},
                    votes: {},
                    nightStep: 'killer',
                    detectiveResult: {},
                    lastNightResult: '',
                    lastDayResult: '',
                    winner: null
                });
            }
        }
        
        // Add player to global game
        const playersRef = ref(database, `games/${GLOBAL_GAME_ID}/players`);
        currentPlayerId = push(playersRef).key;
        
        // Check if this is the first player (should be admin)
        const gameSnapshot = await get(gameRef);
        const gameData = gameSnapshot.val();
        const isFirstPlayer = !gameData || Object.keys(gameData.players || {}).length === 0;
        
        if (isFirstPlayer) {
            // First player becomes admin
            await update(gameRef, {
                admin: currentPlayerId
            });
            isAdmin = true;
            console.log('You are the admin!');
        }
        
        console.log('Adding player:', playerName, 'with ID:', currentPlayerId);
        await set(ref(database, `games/${GLOBAL_GAME_ID}/players/${currentPlayerId}`), {
            name: playerName,
            ready: false,
            role: null,
            alive: true,
            voted: false,
            voteTarget: null
        });

        // Save session to localStorage
        saveSession();

        // Listen to game changes
        listenToGame();
        
        showScreen('lobby');
        joinGameBtn.disabled = false;
        joinGameBtn.textContent = 'Join Game';
    } catch (error) {
        console.error('Error joining game:', error);
        alert('Error joining game: ' + error.message + '\n\nPlease check:\n1. Firebase Realtime Database is enabled\n2. Database rules allow read/write\n3. Check browser console for details');
        joinGameBtn.disabled = false;
        joinGameBtn.textContent = 'Join Game';
    }
}

// Listen to game state
function listenToGame() {
    const gameRef = ref(database, `games/${GLOBAL_GAME_ID}`);
    
    console.log('Listening to global game');
    
    onValue(gameRef, (snapshot) => {
        const game = snapshot.val();
        console.log('Game state updated:', game);
        
        if (!game) {
            console.warn('Game not found in database');
            return;
        }

        updateLobby(game);
        
        if (game.status === 'playing') {
            showScreen('game');
            updateGame(game);
        }
    }, (error) => {
        console.error('Error listening to game:', error);
        alert('Error connecting to game: ' + error.message);
    });
}

// Update lobby
function updateLobby(game) {
    if (game.status !== 'lobby') return;
    const players = game.players || {};
    const playerArray = Object.entries(players);
    
    // Check if current player is admin
    isAdmin = game.admin === currentPlayerId;
    
    // Show/hide admin panel
    if (adminPanel) {
        adminPanel.style.display = isAdmin ? 'block' : 'none';
        if (isAdmin && game.settings) {
            if (killerCountInput) {
                killerCountInput.value = game.settings.killerCount || 1;
            }
            if (actionTimeInput) {
                actionTimeInput.value = game.settings.actionTime || 10;
            }
        }
    }
    
    playerCount.textContent = playerArray.length;
    
    // Update players list
    playersList.innerHTML = '';
    playerArray.forEach(([id, player]) => {
        const playerItem = document.createElement('div');
        playerItem.className = `player-item ${player.ready ? 'ready' : ''}`;
        playerItem.innerHTML = `
            <span class="player-name">${player.name}${id === currentPlayerId ? ' (You)' : ''}</span>
            <span class="player-status">${player.ready ? '✓ Ready' : 'Waiting...'}</span>
        `;
        playersList.appendChild(playerItem);
    });

    // Check if all ready
    const allReady = playerArray.length >= 3 && playerArray.every(([_, p]) => p.ready);
    if (allReady && playerArray.length <= 10) {
        waitingMessage.textContent = 'All players ready! Starting game...';
        setTimeout(() => startGame(game), 2000);
    } else if (playerArray.length < 3) {
        waitingMessage.textContent = `Waiting for more players (${playerArray.length}/3 minimum)...`;
    } else {
        const readyCount = playerArray.filter(([_, p]) => p.ready).length;
        waitingMessage.textContent = `Waiting for ${playerArray.length - readyCount} more player(s) to be ready...`;
    }
}

// Toggle ready
async function toggleReady() {
    const playerRef = ref(database, `games/${GLOBAL_GAME_ID}/players/${currentPlayerId}`);
    const snapshot = await get(playerRef);
    const player = snapshot.val();
    
    await update(playerRef, {
        ready: !player.ready
    });
}

// Start game
async function startGame(game) {
    const players = Object.entries(game.players || {});
    if (players.length < 3 || players.length > 10) {
        alert('Game requires 3-10 players');
        return;
    }

    // Get settings
    const killerCount = (game.settings && game.settings.killerCount) || 1;
    const minPlayers = killerCount + 2; // At least killers + doctor + detective
    
    if (players.length < minPlayers) {
        alert(`Game requires at least ${minPlayers} players for ${killerCount} killer(s)`);
        return;
    }

    // Assign roles
    const roles = assignRoles(players.length, killerCount);
    const shuffledRoles = shuffleArray([...roles]);
    
    // Start background music
    if (backgroundMusic) {
        backgroundMusic.play().catch(e => {
            console.log('Could not play background music:', e);
            // Music autoplay might be blocked by browser
        });
    }
    
    // Assign god (random player)
    const godId = players[Math.floor(Math.random() * players.length)][0];
    
    // Update players with roles
    const updates = {};
    players.forEach(([id, player], index) => {
        updates[`games/${GLOBAL_GAME_ID}/players/${id}/role`] = shuffledRoles[index];
        updates[`games/${GLOBAL_GAME_ID}/players/${id}/alive`] = true;
    });
    
    updates[`games/${GLOBAL_GAME_ID}/god`] = godId;
    updates[`games/${GLOBAL_GAME_ID}/status`] = 'playing';
    updates[`games/${GLOBAL_GAME_ID}/phase`] = 'night';
    updates[`games/${GLOBAL_GAME_ID}/nightCount`] = 1;
    updates[`games/${GLOBAL_GAME_ID}/dayCount`] = 0;
    updates[`games/${GLOBAL_GAME_ID}/nightActions`] = {};
    updates[`games/${GLOBAL_GAME_ID}/votes`] = {};
    updates[`games/${GLOBAL_GAME_ID}/lastNightResult`] = '';
    updates[`games/${GLOBAL_GAME_ID}/lastDayResult`] = '';
    updates[`games/${GLOBAL_GAME_ID}/nightStep`] = 'everyone-close'; // Start with everyone closing eyes
    updates[`games/${GLOBAL_GAME_ID}/nightStepStartTime`] = Date.now(); // Track when step started
    updates[`games/${GLOBAL_GAME_ID}/detectiveResult`] = {}; // Store detective results per player

    await update(ref(database), updates);
    
    // Play everyone close eyes sound and start sequence
    if (soundEveryoneClose) {
        soundEveryoneClose.play().catch(e => console.log('Sound play failed:', e));
    }
    
    // After 5 seconds, move to killer open
    setTimeout(() => {
        advanceNightStep('killer-open');
    }, 5000);
}

// Assign roles based on player count and settings
function assignRoles(count, killerCount = 1) {
    const roles = [];
    
    // Add killers based on settings
    for (let i = 0; i < killerCount; i++) {
        roles.push('Killer');
    }
    
    // Always have 1 Doctor and 1 Detective
    roles.push('Doctor');
    roles.push('Detective');
    
    // Fill rest with villagers
    const villagers = count - killerCount - 2; // -2 for Doctor and Detective
    for (let i = 0; i < villagers; i++) {
        roles.push('Villager');
    }
    
    return roles;
}

// Shuffle array
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Update game screen
function updateGame(game) {
    const players = game.players || {};
    const currentPlayer = players[currentPlayerId];
    
    if (!currentPlayer) return;

    playerRole = currentPlayer.role || '';
    isGod = game.god === currentPlayerId;
    
    // Update role display - hide during day phase for uniform screen
    if (game.phase === 'day') {
        roleDisplay.style.display = 'none';
    } else {
        roleDisplay.style.display = 'block';
        playerRoleSpan.textContent = playerRole;
        roleDescription.textContent = getRoleDescription(playerRole);
    }
    
    // Hide god view during game (will show after game over)
    godView.style.display = 'none';
    
    // Update phase
    currentPhase.textContent = game.phase || 'lobby';
    
    // Show appropriate phase
    if (game.phase === 'night') {
        showNightPhase(game);
    } else if (game.phase === 'day') {
        showDayPhase(game);
    } else if (game.phase === 'gameover') {
        showGameOver(game);
    }
    
    // Update players status
    updatePlayersStatus(players);
}

// Get role description
function getRoleDescription(role) {
    const descriptions = {
        'Killer': 'Your goal is to eliminate all villagers. Each night, you can kill one player.',
        'Doctor': 'You can save one player each night from being killed. You cannot save yourself.',
        'Detective': 'Each night, you can investigate one player to find out if they are the killer.',
        'Villager': 'You are a regular villager. Work with others to find and eliminate the killer.'
    };
    return descriptions[role] || '';
}

// Update god view
function updateGodView(game) {
    const players = game.players || {};
    const playerArray = Object.entries(players);
    
    godInfo.innerHTML = '<h3>All Roles:</h3>';
    playerArray.forEach(([id, player]) => {
        const item = document.createElement('div');
        item.className = 'god-info-item';
        item.innerHTML = `<strong>${player.name}:</strong> ${player.role} ${player.alive ? '✓' : '✗'}`;
        godInfo.appendChild(item);
    });
    
    // God actions
    if (game.phase === 'night' && game.nightActions) {
        const actions = game.nightActions;
        godActions.innerHTML = '<h3>Night Actions:</h3>';
        Object.entries(actions).forEach(([playerId, action]) => {
            const player = players[playerId];
            const target = action.target ? players[action.target] : null;
            const item = document.createElement('div');
            item.className = 'god-info-item';
            item.innerHTML = `<strong>${player.name}</strong> (${player.role}): ${action.type} ${target ? target.name : 'none'}`;
            godActions.appendChild(item);
        });
    }
}

// Advance night step
async function advanceNightStep(nextStep) {
    const gameRef = ref(database, `games/${GLOBAL_GAME_ID}`);
    await update(gameRef, {
        nightStep: nextStep,
        nightStepStartTime: Date.now()
    });
}

// Show night phase with timed sequential actions
function showNightPhase(game) {
    nightPhase.style.display = 'block';
    dayPhase.style.display = 'none';
    
    const players = game.players || {};
    const currentPlayer = players[currentPlayerId];
    const nightStep = game.nightStep || 'everyone-close';
    const nightStepStartTime = game.nightStepStartTime || Date.now();
    const actionTime = (game.settings && game.settings.actionTime) || 10;
    
    if (!currentPlayer || !currentPlayer.alive) {
        nightAnnouncement.innerHTML = '<p>You are dead. Close your eyes and wait...</p>';
        nightActions.innerHTML = '';
        submitNightActionBtn.style.display = 'none';
        return;
    }
    
    // Calculate time remaining
    const elapsed = (Date.now() - nightStepStartTime) / 1000;
    let timeRemaining = 0;
    let announcement = '';
    let canAct = false;
    let showTimer = false;
    
    // Handle each step
    if (nightStep === 'everyone-close') {
        announcement = '🌙 <strong>Everyone, close your eyes!</strong>';
        canAct = false;
        showTimer = false;
        if (soundEveryoneClose) {
            soundEveryoneClose.play().catch(e => console.log('Sound play failed:', e));
        }
    } else if (nightStep === 'killer-open') {
        announcement = '🌙 <strong>Killers, open your eyes!</strong> Choose someone to kill.';
        canAct = playerRole === 'Killer';
        showTimer = true;
        timeRemaining = Math.max(0, actionTime - elapsed);
        if (elapsed < 0.5 && soundKillerOpen) {
            soundKillerOpen.play().catch(e => console.log('Sound play failed:', e));
        }
    } else if (nightStep === 'killer-close') {
        announcement = '🌙 <strong>Killers, close your eyes!</strong>';
        canAct = false;
        showTimer = false;
        if (soundKillerClose) {
            soundKillerClose.play().catch(e => console.log('Sound play failed:', e));
        }
    } else if (nightStep === 'healer-open') {
        announcement = '💊 <strong>Healer, open your eyes!</strong> Choose someone to heal.';
        canAct = playerRole === 'Doctor';
        showTimer = true;
        timeRemaining = Math.max(0, actionTime - elapsed);
        if (elapsed < 0.5 && soundHealerOpen) {
            soundHealerOpen.play().catch(e => console.log('Sound play failed:', e));
        }
    } else if (nightStep === 'healer-close') {
        announcement = '💊 <strong>Healer, close your eyes!</strong>';
        canAct = false;
        showTimer = false;
        if (soundHealerClose) {
            soundHealerClose.play().catch(e => console.log('Sound play failed:', e));
        }
    } else if (nightStep === 'detective-open') {
        announcement = '🔍 <strong>Detective, open your eyes!</strong> Choose someone to investigate.';
        canAct = playerRole === 'Detective';
        showTimer = true;
        timeRemaining = Math.max(0, actionTime - elapsed);
        if (elapsed < 0.5 && soundDetectiveOpen) {
            soundDetectiveOpen.play().catch(e => console.log('Sound play failed:', e));
        }
    } else if (nightStep === 'detective-close') {
        announcement = '🔍 <strong>Detective, close your eyes!</strong>';
        canAct = false;
        showTimer = false;
        if (soundDetectiveClose) {
            soundDetectiveClose.play().catch(e => console.log('Sound play failed:', e));
        }
    } else if (nightStep === 'everyone-open') {
        announcement = '👁️ <strong>Everyone, open your eyes!</strong> Night is over.';
        canAct = false;
        showTimer = false;
        if (soundEveryoneOpen) {
            soundEveryoneOpen.play().catch(e => console.log('Sound play failed:', e));
        }
    } else {
        announcement = '🌙 <strong>Close your eyes!</strong> Waiting...';
        canAct = false;
        showTimer = false;
    }
    
    // Show announcement with timer
    let announcementHTML = `<div class="announcement-text">${announcement}</div>`;
    if (showTimer && timeRemaining > 0) {
        announcementHTML += `<div class="timer-display">Time remaining: <strong>${Math.ceil(timeRemaining)}s</strong></div>`;
    }
    nightAnnouncement.innerHTML = announcementHTML;
    
    // Check if already submitted for current step
    const nightActionsData = game.nightActions || {};
    let stepKey = '';
    if (nightStep === 'killer-open') stepKey = `killer_${currentPlayerId}`;
    else if (nightStep === 'healer-open') stepKey = `healer_${currentPlayerId}`;
    else if (nightStep === 'detective-open') stepKey = `detective_${currentPlayerId}`;
    
    const alreadySubmitted = stepKey && nightActionsData[stepKey];
    
    if (alreadySubmitted) {
        const action = alreadySubmitted;
        const target = action.target ? players[action.target] : null;
        nightActions.innerHTML = `<p>You have submitted: <strong>${action.type}</strong> ${target ? `on ${target.name}` : ''}</p>`;
        submitNightActionBtn.style.display = 'none';
        return;
    }
    
    nightActions.innerHTML = '';
    submitNightActionBtn.style.display = 'none';
    
    // Show actions only if it's this player's turn and they can act
    if (canAct && timeRemaining > 0) {
        if (playerRole === 'Killer' && nightStep === 'killer-open') {
            showKillerActions(players);
        } else if (playerRole === 'Doctor' && nightStep === 'healer-open') {
            showDoctorActions(players);
        } else if (playerRole === 'Detective' && nightStep === 'detective-open') {
            showDetectiveActions(players);
        }
    } else if (!canAct) {
        nightActions.innerHTML = '<p>Close your eyes and wait for your turn...</p>';
    } else if (timeRemaining <= 0) {
        nightActions.innerHTML = '<p>Time is up! Waiting for next step...</p>';
    }
    
    // Auto-advance steps based on timers
    checkAndAdvanceNightStep(game, nightStep, nightStepStartTime, actionTime);
    
    // Update timer display every second if showing timer
    if (showTimer && timeRemaining > 0) {
        setTimeout(() => {
            const gameRef = ref(database, `games/${GLOBAL_GAME_ID}`);
            get(gameRef).then(snapshot => {
                const updatedGame = snapshot.val();
                if (updatedGame && updatedGame.phase === 'night') {
                    showNightPhase(updatedGame);
                }
            });
        }, 1000);
    }
}

// Check and advance night step based on timers
async function checkAndAdvanceNightStep(game, nightStep, nightStepStartTime, actionTime) {
    const elapsed = (Date.now() - nightStepStartTime) / 1000;
    let shouldAdvance = false;
    let nextStep = '';
    
    if (nightStep === 'everyone-close' && elapsed >= 5) {
        // After 5 seconds, move to killer open
        shouldAdvance = true;
        nextStep = 'killer-open';
    } else if (nightStep === 'killer-open' && elapsed >= actionTime) {
        // After action time, move to killer close
        shouldAdvance = true;
        nextStep = 'killer-close';
    } else if (nightStep === 'killer-close' && elapsed >= 3) {
        // After 3 seconds, move to healer open
        shouldAdvance = true;
        nextStep = 'healer-open';
    } else if (nightStep === 'healer-open' && elapsed >= actionTime) {
        // After action time, move to healer close
        shouldAdvance = true;
        nextStep = 'healer-close';
    } else if (nightStep === 'healer-close' && elapsed >= 3) {
        // After 3 seconds, move to detective open
        shouldAdvance = true;
        nextStep = 'detective-open';
    } else if (nightStep === 'detective-open' && elapsed >= actionTime) {
        // After action time, move to detective close
        shouldAdvance = true;
        nextStep = 'detective-close';
    } else if (nightStep === 'detective-close' && elapsed >= 3) {
        // After 3 seconds, move to everyone open
        shouldAdvance = true;
        nextStep = 'everyone-open';
    } else if (nightStep === 'everyone-open' && elapsed >= 2) {
        // After 2 seconds, process night
        shouldAdvance = false;
        await processNight(game);
        return;
    }
    
    if (shouldAdvance) {
        await advanceNightStep(nextStep);
    } else {
        // Set up a check for the next second if we're waiting
        const timeUntilNext = 
            nightStep === 'everyone-close' ? 5 - elapsed :
            nightStep === 'killer-open' ? actionTime - elapsed :
            nightStep === 'killer-close' ? 3 - elapsed :
            nightStep === 'healer-open' ? actionTime - elapsed :
            nightStep === 'healer-close' ? 3 - elapsed :
            nightStep === 'detective-open' ? actionTime - elapsed :
            nightStep === 'detective-close' ? 3 - elapsed :
            nightStep === 'everyone-open' ? 2 - elapsed : 1;
        
        if (timeUntilNext > 0 && timeUntilNext <= 1) {
            setTimeout(() => {
                const gameRef = ref(database, `games/${GLOBAL_GAME_ID}`);
                get(gameRef).then(snapshot => {
                    const updatedGame = snapshot.val();
                    if (updatedGame && updatedGame.phase === 'night') {
                        checkAndAdvanceNightStep(updatedGame, updatedGame.nightStep, updatedGame.nightStepStartTime, actionTime);
                    }
                });
            }, timeUntilNext * 1000);
        }
    }
}

// Show killer actions
function showKillerActions(players) {
    const alivePlayers = Object.entries(players).filter(([id, p]) => p.alive && id !== currentPlayerId);
    
    nightActions.innerHTML = '<h3>Choose a player to kill:</h3>';
    alivePlayers.forEach(([id, player]) => {
        const option = document.createElement('div');
        option.className = 'action-item';
        option.textContent = player.name;
        option.dataset.targetId = id;
        option.addEventListener('click', () => selectNightAction('kill', id, option));
        nightActions.appendChild(option);
    });
}

// Show doctor actions
function showDoctorActions(players) {
    const alivePlayers = Object.entries(players).filter(([id, p]) => p.alive && id !== currentPlayerId);
    
    nightActions.innerHTML = '<h3>Choose a player to heal:</h3>';
    alivePlayers.forEach(([id, player]) => {
        const option = document.createElement('div');
        option.className = 'action-item';
        option.textContent = player.name;
        option.dataset.targetId = id;
        option.addEventListener('click', () => selectNightAction('heal', id, option));
        nightActions.appendChild(option);
    });
}

// Show detective actions
function showDetectiveActions(players) {
    const alivePlayers = Object.entries(players).filter(([id, p]) => p.alive && id !== currentPlayerId);
    
    nightActions.innerHTML = '<h3>Choose a player to investigate:</h3>';
    alivePlayers.forEach(([id, player]) => {
        const option = document.createElement('div');
        option.className = 'action-item';
        option.textContent = player.name;
        option.dataset.targetId = id;
        option.addEventListener('click', () => selectNightAction('investigate', id, option));
        nightActions.appendChild(option);
    });
}

// Select night action
let selectedNightAction = null;
function selectNightAction(type, targetId, element) {
    // Remove previous selection
    document.querySelectorAll('.action-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    element.classList.add('selected');
    selectedNightAction = { type, targetId };
    submitNightActionBtn.style.display = 'block';
}

// Submit night action
async function submitNightAction() {
    if (!selectedNightAction) return;
    
    const gameRef = ref(database, `games/${GLOBAL_GAME_ID}`);
    const snapshot = await get(gameRef);
    const game = snapshot.val();
    const nightStep = game.nightStep || 'killer-open';
    
    // Determine step key based on current step
    let stepKey = '';
    if (nightStep === 'killer-open') {
        stepKey = `killer_${currentPlayerId}`;
    } else if (nightStep === 'healer-open') {
        stepKey = `healer_${currentPlayerId}`;
    } else if (nightStep === 'detective-open') {
        stepKey = `detective_${currentPlayerId}`;
    }
    
    if (!stepKey) return;
    
    // Store action
    await set(ref(database, `games/${GLOBAL_GAME_ID}/nightActions/${stepKey}`), {
        type: selectedNightAction.type,
        target: selectedNightAction.targetId,
        step: nightStep
    });
    
    // Show confirmation
    const players = game.players || {};
    const target = selectedNightAction.targetId ? players[selectedNightAction.targetId] : null;
    nightActions.innerHTML = `<p>You have submitted: <strong>${selectedNightAction.type}</strong> ${target ? `on ${target.name}` : ''}</p>`;
    submitNightActionBtn.style.display = 'none';
}

// Process night
async function processNight(game) {
    const players = game.players || {};
    const nightActionsData = game.nightActions || {};
    const updates = {};
    
    // Process killer actions (all killers)
    const killerActions = Object.entries(nightActionsData).filter(([key, action]) => 
        action.step === 'killer-open' && action.type === 'kill'
    );
    
    // Process doctor actions (all doctors)
    const doctorActions = Object.entries(nightActionsData).filter(([key, action]) => 
        action.step === 'healer-open' && action.type === 'heal'
    );
    
    // Get killed targets
    const killedTargets = new Set();
    killerActions.forEach(([key, action]) => {
        if (action.target) {
            killedTargets.add(action.target);
        }
    });
    
    // Check if any killed target was healed
    const healedTargets = new Set();
    doctorActions.forEach(([key, action]) => {
        if (action.target) {
            healedTargets.add(action.target);
        }
    });
    
    // Determine who was actually killed (not healed)
    let killedPlayer = null;
    for (const targetId of killedTargets) {
        if (!healedTargets.has(targetId)) {
            killedPlayer = players[targetId];
            updates[`games/${GLOBAL_GAME_ID}/players/${targetId}/alive`] = false;
            break; // Only one can be killed per night (first unhealed target)
        }
    }
    
    // Process detective actions - store privately per detective
    const detectiveActions = Object.entries(nightActionsData).filter(([key, action]) => 
        action.step === 'detective-open' && action.type === 'investigate'
    );
    
    const detectiveResults = {};
    detectiveActions.forEach(([key, action]) => {
        if (action.target) {
            const targetId = action.target;
            const target = players[targetId];
            const detectiveId = key.split('_')[1]; // Extract player ID from key
            detectiveResults[detectiveId] = `${target.name} is ${target.role === 'Killer' ? 'the Killer' : 'not the Killer'}`;
        }
    });
    
    // Store detective results privately
    updates[`games/${GLOBAL_GAME_ID}/detectiveResult`] = detectiveResults;
    
    // Create night result (public, no detective info)
    let nightResult = '';
    if (killedPlayer) {
        nightResult = `🌙 Night ${game.nightCount}: ${killedPlayer.name} was killed!`;
    } else {
        nightResult = `🌙 Night ${game.nightCount}: No one was killed!`;
    }
    
    // Check win conditions
    const alivePlayers = Object.values(players).filter(p => p.alive);
    const aliveKillers = alivePlayers.filter(p => p.role === 'Killer');
    const aliveVillagers = alivePlayers.filter(p => p.role !== 'Killer');
    
    if (aliveKillers.length === 0) {
        updates[`games/${GLOBAL_GAME_ID}/phase`] = 'gameover';
        updates[`games/${GLOBAL_GAME_ID}/status`] = 'finished';
        updates[`games/${GLOBAL_GAME_ID}/winner`] = 'Villagers';
    } else if (aliveKillers.length >= aliveVillagers.length) {
        updates[`games/${GLOBAL_GAME_ID}/phase`] = 'gameover';
        updates[`games/${GLOBAL_GAME_ID}/status`] = 'finished';
        updates[`games/${GLOBAL_GAME_ID}/winner`] = 'Killer';
    } else {
        // Move to day phase
        updates[`games/${GLOBAL_GAME_ID}/phase`] = 'day';
        updates[`games/${GLOBAL_GAME_ID}/dayCount`] = (game.dayCount || 0) + 1;
        updates[`games/${GLOBAL_GAME_ID}/votes`] = {};
    }
    
    updates[`games/${GLOBAL_GAME_ID}/lastNightResult`] = nightResult;
    updates[`games/${GLOBAL_GAME_ID}/nightActions`] = {};
    updates[`games/${GLOBAL_GAME_ID}/nightStep`] = 'everyone-close'; // Reset for next night
    
    await update(ref(database), updates);
}

// Show day phase
function showDayPhase(game) {
    nightPhase.style.display = 'none';
    dayPhase.style.display = 'block';
    
    const players = game.players || {};
    const currentPlayer = players[currentPlayerId];
    
    // Show night results
    let dayResultsHTML = `<pre>${game.lastNightResult || 'Night results...'}</pre>`;
    
    // Show detective result only to detective
    const detectiveResults = game.detectiveResult || {};
    if (detectiveResults[currentPlayerId] && playerRole === 'Detective') {
        dayResultsHTML += `<div class="detective-result"><strong>🔍 Your Investigation:</strong> ${detectiveResults[currentPlayerId]}</div>`;
    }
    
    dayResults.innerHTML = dayResultsHTML;
    
    // Show voting
    if (!currentPlayer || !currentPlayer.alive) {
        votingSection.innerHTML = '<p>You are dead. Waiting for voting to end...</p>';
        return;
    }
    
    // Check if already voted
    const votes = game.votes || {};
    if (votes[currentPlayerId] !== undefined) {
        if (votes[currentPlayerId] === 'skip') {
            voteOptions.innerHTML = `<p>You chose to <strong>skip voting</strong>.</p>`;
        } else {
            const targetId = votes[currentPlayerId];
            const target = players[targetId];
            voteOptions.innerHTML = `<p>You voted to eliminate: <strong>${target.name}</strong></p>`;
        }
        submitVoteBtn.style.display = 'none';
        skipVoteBtn.style.display = 'none';
        return;
    }
    
    // Show vote options
    voteOptions.innerHTML = '';
    const alivePlayers = Object.entries(players).filter(([id, p]) => p.alive && id !== currentPlayerId);
    
    alivePlayers.forEach(([id, player]) => {
        const option = document.createElement('div');
        option.className = 'vote-option';
        option.textContent = player.name;
        option.dataset.targetId = id;
        option.addEventListener('click', () => selectVote(id, option));
        voteOptions.appendChild(option);
    });
    
    submitVoteBtn.style.display = 'block';
    skipVoteBtn.style.display = 'block';
}

// Select vote
let selectedVote = null;
function selectVote(targetId, element) {
    document.querySelectorAll('.vote-option').forEach(item => {
        item.classList.remove('selected');
    });
    element.classList.add('selected');
    selectedVote = targetId;
}

// Skip vote
async function skipVote() {
    await set(ref(database, `games/${GLOBAL_GAME_ID}/votes/${currentPlayerId}`), 'skip');
    
    // Wait a bit for the vote to be saved, then check if all alive players voted
    setTimeout(async () => {
        const gameRef = ref(database, `games/${GLOBAL_GAME_ID}`);
        const snapshot = await get(gameRef);
        const game = snapshot.val();
        if (!game) return;
        
        const players = game.players || {};
        const votes = game.votes || {};
        
        const alivePlayers = Object.keys(players).filter(id => players[id].alive);
        
        // Check if all alive players have voted (including skips)
        if (alivePlayers.length === Object.keys(votes).length) {
            await processVoting(game);
        }
    }, 500);
}

// Submit vote
async function submitVote() {
    if (!selectedVote) return;
    
    await set(ref(database, `games/${GLOBAL_GAME_ID}/votes/${currentPlayerId}`), selectedVote);
    
    // Wait a bit for the vote to be saved, then check if all alive players voted
    setTimeout(async () => {
        const gameRef = ref(database, `games/${GLOBAL_GAME_ID}`);
        const snapshot = await get(gameRef);
        const game = snapshot.val();
        if (!game) return;
        
        const players = game.players || {};
        const votes = game.votes || {};
        
        const alivePlayers = Object.keys(players).filter(id => players[id].alive);
        
        // Check if all alive players have voted
        if (alivePlayers.length === Object.keys(votes).length) {
            await processVoting(game);
        }
    }, 500);
}

// Process voting
async function processVoting(game) {
    const players = game.players || {};
    const votes = game.votes || {};
    
    // Check if everyone skipped
    const allSkipped = Object.values(votes).every(vote => vote === 'skip');
    
    const updates = {};
    let dayResult = '';
    
    if (allSkipped) {
        // Everyone skipped - no one eliminated
        dayResult = `☀️ Day ${game.dayCount}: No one was eliminated (everyone skipped voting).`;
    } else {
        // Count votes (exclude 'skip')
        const voteCounts = {};
        Object.entries(votes).forEach(([voterId, targetId]) => {
            if (targetId !== 'skip') {
                voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
            }
        });
        
        // Find player with most votes
        let maxVotes = 0;
        let eliminatedId = null;
        Object.entries(voteCounts).forEach(([id, count]) => {
            if (count > maxVotes) {
                maxVotes = count;
                eliminatedId = id;
            }
        });
        
        const aliveCount = Object.values(players).filter(p => p.alive).length;
        const majority = Math.ceil(aliveCount / 2);
        
        // Need majority to eliminate (more than half)
        if (eliminatedId && maxVotes > majority) {
            const eliminated = players[eliminatedId];
            updates[`games/${GLOBAL_GAME_ID}/players/${eliminatedId}/alive`] = false;
            dayResult = `☀️ Day ${game.dayCount}: ${eliminated.name} was eliminated! They were a ${eliminated.role}.`;
        } else {
            dayResult = `☀️ Day ${game.dayCount}: No one was eliminated (no majority vote).`;
        }
    }
    
    // Check win conditions
    const alivePlayers = Object.values(players).filter(p => p.alive);
    const aliveKillers = alivePlayers.filter(p => p.role === 'Killer');
    const aliveVillagers = alivePlayers.filter(p => p.role !== 'Killer');
    
    if (aliveKillers.length === 0) {
        updates[`games/${GLOBAL_GAME_ID}/phase`] = 'gameover';
        updates[`games/${GLOBAL_GAME_ID}/status`] = 'finished';
        updates[`games/${GLOBAL_GAME_ID}/winner`] = 'Villagers';
    } else if (aliveKillers.length >= aliveVillagers.length) {
        updates[`games/${GLOBAL_GAME_ID}/phase`] = 'gameover';
        updates[`games/${GLOBAL_GAME_ID}/status`] = 'finished';
        updates[`games/${GLOBAL_GAME_ID}/winner`] = 'Killer';
    } else {
        // Move to next night
        updates[`games/${GLOBAL_GAME_ID}/phase`] = 'night';
        updates[`games/${GLOBAL_GAME_ID}/nightCount`] = (game.nightCount || 0) + 1;
        updates[`games/${GLOBAL_GAME_ID}/nightActions`] = {};
        updates[`games/${GLOBAL_GAME_ID}/votes`] = {};
        updates[`games/${GLOBAL_GAME_ID}/nightStep`] = 'everyone-close'; // Reset night step
        updates[`games/${GLOBAL_GAME_ID}/nightStepStartTime`] = Date.now();
        
        // Play everyone close eyes sound and start sequence
        if (soundEveryoneClose) {
            soundEveryoneClose.play().catch(e => console.log('Sound play failed:', e));
        }
        
        // After 5 seconds, move to killer open
        setTimeout(() => {
            advanceNightStep('killer-open');
        }, 5000);
    }
    
    updates[`games/${GLOBAL_GAME_ID}/lastDayResult`] = dayResult;
    
    await update(ref(database), updates);
}

// Show game over
function showGameOver(game) {
    nightPhase.style.display = 'none';
    dayPhase.style.display = 'none';
    gameOver.style.display = 'block';
    
    const winner = game.winner || 'Unknown';
    const players = game.players || {};
    
    let resultHTML = `<h3>${winner} Win!</h3>`;
    resultHTML += '<h4>Final Roles:</h4><ul>';
    
    Object.values(players).forEach(player => {
        resultHTML += `<li>${player.name}: ${player.role} ${player.alive ? '✓' : '✗'}</li>`;
    });
    
    resultHTML += '</ul>';
    gameResult.innerHTML = resultHTML;
    
    // Show god view to everyone after game over
    if (godViewGameOver && godInfoGameOver) {
        godViewGameOver.style.display = 'block';
        godInfoGameOver.innerHTML = '<h3>All Roles:</h3>';
        Object.entries(players).forEach(([id, player]) => {
            const item = document.createElement('div');
            item.className = 'god-info-item';
            item.innerHTML = `<strong>${player.name}:</strong> ${player.role} ${player.alive ? '✓' : '✗'}`;
            godInfoGameOver.appendChild(item);
        });
    }
}

// Start new game (keep same name)
async function startNewGame() {
    // Stop music
    if (backgroundMusic) {
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
    }
    
    // Reset game state in Firebase
    const gameRef = ref(database, `games/${GLOBAL_GAME_ID}`);
    await update(gameRef, {
        status: 'lobby',
        phase: 'lobby',
        players: {},
        god: null,
        admin: null,
        nightActions: {},
        votes: {},
        nightStep: 'killer',
        detectiveResult: {},
        lastNightResult: '',
        lastDayResult: ''
    });
    
    // Remove current player and re-add them
    if (currentPlayerId) {
        await remove(ref(database, `games/${GLOBAL_GAME_ID}/players/${currentPlayerId}`));
    }
    
    // Rejoin with same name
    currentPlayerId = null;
    await handleJoinGame();
}

// Go home
function goHome() {
    // Stop music
    if (backgroundMusic) {
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
    }
    
    // Clear saved session
    clearSavedSession();
    
    // Reset state
    currentPlayerId = null;
    playerName = '';
    isAdmin = false;
    isGod = false;
    
    showScreen('welcome');
}

// Update players status
function updatePlayersStatus(players) {
    playersStatus.innerHTML = '<h3>Players Status</h3><div class="status-grid"></div>';
    const grid = playersStatus.querySelector('.status-grid');
    
    Object.values(players).forEach(player => {
        const statusPlayer = document.createElement('div');
        statusPlayer.className = `status-player ${player.alive ? 'alive' : 'dead'}`;
        statusPlayer.textContent = player.name;
        grid.appendChild(statusPlayer);
    });
}

// Show screen
function showScreen(screenName) {
    welcomeScreen.classList.remove('active');
    lobbyScreen.classList.remove('active');
    gameScreen.classList.remove('active');
    
    if (screenName === 'welcome') welcomeScreen.classList.add('active');
    else if (screenName === 'lobby') lobbyScreen.classList.add('active');
    else if (screenName === 'game') gameScreen.classList.add('active');
}

// Save admin settings
async function saveAdminSettings() {
    if (!isAdmin) return;
    
    const killerCount = parseInt(killerCountInput.value) || 1;
    if (killerCount < 1 || killerCount > 3) {
        alert('Number of killers must be between 1 and 3');
        return;
    }
    
    const actionTime = parseInt(actionTimeInput.value) || 10;
    if (actionTime < 5 || actionTime > 30) {
        alert('Action time must be between 5 and 30 seconds');
        return;
    }
    
    try {
        await update(ref(database, `games/${GLOBAL_GAME_ID}/settings`), {
            killerCount: killerCount,
            actionTime: actionTime
        });
        
        saveSettingsBtn.textContent = '✓ Saved!';
        saveSettingsBtn.style.background = '#28a745';
        setTimeout(() => {
            saveSettingsBtn.textContent = 'Save Settings';
            saveSettingsBtn.style.background = '';
        }, 2000);
    } catch (error) {
        console.error('Error saving settings:', error);
        alert('Error saving settings');
    }
}

// Leave game
async function leaveGame() {
    // Stop music
    if (backgroundMusic) {
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
    }
    
    // Clear saved session
    clearSavedSession();
    
    if (currentPlayerId && GLOBAL_GAME_ID) {
        await remove(ref(database, `games/${GLOBAL_GAME_ID}/players/${currentPlayerId}`));
    }
    
    // Reset state
    currentPlayerId = null;
    playerName = '';
    isAdmin = false;
    isGod = false;
    
    window.location.href = window.location.pathname;
}

// Reset game
function resetGame() {
    // Stop music
    if (backgroundMusic) {
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
    }
    
    // Clear saved session
    clearSavedSession();
    
    // Reset state
    currentPlayerId = null;
    playerName = '';
    isAdmin = false;
    isGod = false;
    
    window.location.href = window.location.pathname;
}

// Initialize on load - wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    // DOM is already ready
    init();
}

