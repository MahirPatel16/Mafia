import { database } from './firebase-config.js';
import { ref, set, onValue, update, push, remove, get } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

// Game state
let currentPlayerId = null;
let gameId = null;
let playerName = '';
let playerRole = '';
let isGod = false;

// DOM elements
const welcomeScreen = document.getElementById('welcomeScreen');
const lobbyScreen = document.getElementById('lobbyScreen');
const gameScreen = document.getElementById('gameScreen');
const playerNameInput = document.getElementById('playerName');
const joinGameBtn = document.getElementById('joinGameBtn');
const gameCodeDisplay = document.getElementById('gameCodeDisplay');
const gameCodeSpan = document.getElementById('gameCode');
const copyCodeBtn = document.getElementById('copyCodeBtn');
const lobbyGameCode = document.getElementById('lobbyGameCode');
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

// Initialize
function init() {
    console.log('Initializing Mafia Game...');
    
    // Check if Firebase is connected
    if (!database) {
        console.error('Firebase database not initialized!');
        alert('Firebase connection error! Please check firebase-config.js');
        return;
    }
    console.log('Firebase connected successfully');

    // Check if URL has game code
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
        gameCodeSpan.textContent = code;
        gameCodeDisplay.style.display = 'block';
    }

    // Event listeners
    joinGameBtn.addEventListener('click', handleJoinGame);
    copyCodeBtn.addEventListener('click', copyGameCode);
    readyBtn.addEventListener('click', toggleReady);
    leaveGameBtn.addEventListener('click', leaveGame);
    submitNightActionBtn.addEventListener('click', submitNightAction);
    submitVoteBtn.addEventListener('click', submitVote);
    newGameBtn.addEventListener('click', resetGame);

    playerNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleJoinGame();
        }
    });
    
    console.log('Initialization complete');
}

// Generate game code
function generateGameCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Join or create game
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
        let code = new URLSearchParams(window.location.search).get('code');

        if (!code) {
            // Create new game
            code = generateGameCode();
            gameId = code;
            const playersRef = ref(database, `games/${code}/players`);
            currentPlayerId = push(playersRef).key;
            
            console.log('Creating new game:', code);
            
            await set(ref(database, `games/${code}`), {
                code: code,
                status: 'lobby',
                players: {},
                god: null,
                phase: 'lobby',
                createdAt: Date.now()
            });

            // Update URL
            window.history.pushState({}, '', `?code=${code}`);
            gameCodeSpan.textContent = code;
            gameCodeDisplay.style.display = 'block';
        } else {
            // Join existing game
            gameId = code;
            const playersRef = ref(database, `games/${code}/players`);
            currentPlayerId = push(playersRef).key;
            console.log('Joining existing game:', code);
        }

        // Add player
        console.log('Adding player:', playerName, 'with ID:', currentPlayerId);
        await set(ref(database, `games/${gameId}/players/${currentPlayerId}`), {
            name: playerName,
            ready: false,
            role: null,
            alive: true,
            voted: false,
            voteTarget: null
        });

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
    const gameRef = ref(database, `games/${gameId}`);
    
    console.log('Listening to game:', gameId);
    
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

    lobbyGameCode.textContent = game.code;
    const players = game.players || {};
    const playerArray = Object.entries(players);
    
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
    const playerRef = ref(database, `games/${gameId}/players/${currentPlayerId}`);
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

    // Assign roles
    const roles = assignRoles(players.length);
    const shuffledRoles = shuffleArray([...roles]);
    
    // Assign god (random player)
    const godId = players[Math.floor(Math.random() * players.length)][0];
    
    // Update players with roles
    const updates = {};
    players.forEach(([id, player], index) => {
        updates[`games/${gameId}/players/${id}/role`] = shuffledRoles[index];
        updates[`games/${gameId}/players/${id}/alive`] = true;
    });
    
    updates[`games/${gameId}/god`] = godId;
    updates[`games/${gameId}/status`] = 'playing';
    updates[`games/${gameId}/phase`] = 'night';
    updates[`games/${gameId}/nightCount`] = 1;
    updates[`games/${gameId}/dayCount`] = 0;
    updates[`games/${gameId}/nightActions`] = {};
    updates[`games/${gameId}/votes`] = {};
    updates[`games/${gameId}/lastNightResult`] = '';
    updates[`games/${gameId}/lastDayResult`] = '';

    await update(ref(database), updates);
}

// Assign roles based on player count
function assignRoles(count) {
    const roles = ['Killer', 'Doctor', 'Detective'];
    const villagers = count - 3;
    
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
    
    // Update role display
    playerRoleSpan.textContent = playerRole;
    roleDescription.textContent = getRoleDescription(playerRole);
    
    // Show/hide god view
    godView.style.display = isGod ? 'block' : 'none';
    if (isGod) {
        updateGodView(game);
    }
    
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

// Show night phase
function showNightPhase(game) {
    nightPhase.style.display = 'block';
    dayPhase.style.display = 'none';
    
    const players = game.players || {};
    const currentPlayer = players[currentPlayerId];
    
    if (!currentPlayer || !currentPlayer.alive) {
        nightActions.innerHTML = '<p>You are dead. Waiting for night to end...</p>';
        submitNightActionBtn.style.display = 'none';
        return;
    }
    
    nightActions.innerHTML = '';
    submitNightActionBtn.style.display = 'none';
    
    // Check if already submitted
    const nightActionsData = game.nightActions || {};
    const alreadySubmitted = nightActionsData[currentPlayerId];
    
    if (alreadySubmitted) {
        const action = alreadySubmitted;
        const target = action.target ? players[action.target] : null;
        nightActions.innerHTML = `<p>You have submitted: <strong>${action.type}</strong> ${target ? `on ${target.name}` : ''}</p>`;
        return;
    }
    
    // Show actions based on role
    if (playerRole === 'Killer') {
        showKillerActions(players);
    } else if (playerRole === 'Doctor') {
        showDoctorActions(players);
    } else if (playerRole === 'Detective') {
        showDetectiveActions(players);
    } else {
        nightActions.innerHTML = '<p>You have no night action. Waiting for night to end...</p>';
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
    
    await set(ref(database, `games/${gameId}/nightActions/${currentPlayerId}`), {
        type: selectedNightAction.type,
        target: selectedNightAction.targetId
    });
    
    // Check if all actions submitted (only god can proceed)
    if (isGod) {
        const gameRef = ref(database, `games/${gameId}`);
        const snapshot = await get(gameRef);
        const game = snapshot.val();
        const players = game.players || {};
        const nightActionsData = game.nightActions || {};
        
        // Count players who should have actions
        const actionRoles = ['Killer', 'Doctor', 'Detective'];
        const shouldHaveActions = Object.entries(players).filter(([id, p]) => 
            p.alive && actionRoles.includes(p.role)
        );
        
        if (shouldHaveActions.length === Object.keys(nightActionsData).length) {
            // All actions submitted, process night
            await processNight(game);
        }
    }
}

// Process night
async function processNight(game) {
    const players = game.players || {};
    const nightActionsData = game.nightActions || {};
    const updates = {};
    
    // Process killer action
    const killerAction = Object.entries(nightActionsData).find(([id, action]) => 
        action.type === 'kill' && players[id]?.role === 'Killer' && players[id]?.alive
    );
    
    // Process doctor action
    const doctorAction = Object.entries(nightActionsData).find(([id, action]) => 
        action.type === 'heal' && players[id]?.role === 'Doctor' && players[id]?.alive
    );
    
    let killedPlayer = null;
    if (killerAction && killerAction[1].target) {
        const targetId = killerAction[1].target;
        // Check if doctor saved
        if (!doctorAction || doctorAction[1].target !== targetId) {
            killedPlayer = players[targetId];
            updates[`games/${gameId}/players/${targetId}/alive`] = false;
        }
    }
    
    // Process detective action
    const detectiveAction = Object.entries(nightActionsData).find(([id, action]) => 
        action.type === 'investigate' && players[id]?.role === 'Detective' && players[id]?.alive
    );
    
    let investigationResult = '';
    if (detectiveAction && detectiveAction[1].target) {
        const targetId = detectiveAction[1].target;
        const target = players[targetId];
        investigationResult = `${target.name} is ${target.role === 'Killer' ? 'the Killer' : 'not the Killer'}`;
    }
    
    // Create night result
    let nightResult = '';
    if (killedPlayer) {
        nightResult = `🌙 Night ${game.nightCount}: ${killedPlayer.name} was killed!`;
    } else {
        nightResult = `🌙 Night ${game.nightCount}: No one was killed!`;
    }
    
    if (investigationResult) {
        nightResult += `\n🔍 Detective found: ${investigationResult}`;
    }
    
    // Check win conditions
    const alivePlayers = Object.values(players).filter(p => p.alive);
    const aliveKillers = alivePlayers.filter(p => p.role === 'Killer');
    const aliveVillagers = alivePlayers.filter(p => p.role !== 'Killer');
    
    if (aliveKillers.length === 0) {
        updates[`games/${gameId}/phase`] = 'gameover';
        updates[`games/${gameId}/winner`] = 'Villagers';
    } else if (aliveKillers.length >= aliveVillagers.length) {
        updates[`games/${gameId}/phase`] = 'gameover';
        updates[`games/${gameId}/winner`] = 'Killer';
    } else {
        // Move to day phase
        updates[`games/${gameId}/phase`] = 'day';
        updates[`games/${gameId}/dayCount`] = (game.dayCount || 0) + 1;
        updates[`games/${gameId}/votes`] = {};
    }
    
    updates[`games/${gameId}/lastNightResult`] = nightResult;
    updates[`games/${gameId}/nightActions`] = {};
    
    await update(ref(database), updates);
}

// Show day phase
function showDayPhase(game) {
    nightPhase.style.display = 'none';
    dayPhase.style.display = 'block';
    
    const players = game.players || {};
    const currentPlayer = players[currentPlayerId];
    
    // Show night results
    dayResults.innerHTML = `<pre>${game.lastNightResult || 'Night results...'}</pre>`;
    
    // Show voting
    if (!currentPlayer || !currentPlayer.alive) {
        votingSection.innerHTML = '<p>You are dead. Waiting for voting to end...</p>';
        return;
    }
    
    // Check if already voted
    const votes = game.votes || {};
    if (votes[currentPlayerId]) {
        const targetId = votes[currentPlayerId];
        const target = players[targetId];
        voteOptions.innerHTML = `<p>You voted to eliminate: <strong>${target.name}</strong></p>`;
        submitVoteBtn.style.display = 'none';
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

// Submit vote
async function submitVote() {
    if (!selectedVote) return;
    
    await set(ref(database, `games/${gameId}/votes/${currentPlayerId}`), selectedVote);
    
    // Check if all alive players voted (only god can proceed)
    if (isGod) {
        const gameRef = ref(database, `games/${gameId}`);
        const snapshot = await get(gameRef);
        const game = snapshot.val();
        const players = game.players || {};
        const votes = game.votes || {};
        
        const alivePlayers = Object.keys(players).filter(id => players[id].alive);
        
        if (alivePlayers.length === Object.keys(votes).length) {
            await processVoting(game);
        }
    }
}

// Process voting
async function processVoting(game) {
    const players = game.players || {};
    const votes = game.votes || {};
    
    // Count votes
    const voteCounts = {};
    Object.values(votes).forEach(targetId => {
        voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
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
    
    const updates = {};
    let dayResult = '';
    
    if (eliminatedId && maxVotes > 0) {
        const eliminated = players[eliminatedId];
        updates[`games/${gameId}/players/${eliminatedId}/alive`] = false;
        dayResult = `☀️ Day ${game.dayCount}: ${eliminated.name} was eliminated! They were a ${eliminated.role}.`;
    } else {
        dayResult = `☀️ Day ${game.dayCount}: No one was eliminated (tie vote).`;
    }
    
    // Check win conditions
    const alivePlayers = Object.values(players).filter(p => p.alive);
    const aliveKillers = alivePlayers.filter(p => p.role === 'Killer');
    const aliveVillagers = alivePlayers.filter(p => p.role !== 'Killer');
    
    if (aliveKillers.length === 0) {
        updates[`games/${gameId}/phase`] = 'gameover';
        updates[`games/${gameId}/winner`] = 'Villagers';
    } else if (aliveKillers.length >= aliveVillagers.length) {
        updates[`games/${gameId}/phase`] = 'gameover';
        updates[`games/${gameId}/winner`] = 'Killer';
    } else {
        // Move to next night
        updates[`games/${gameId}/phase`] = 'night';
        updates[`games/${gameId}/nightCount`] = (game.nightCount || 0) + 1;
        updates[`games/${gameId}/nightActions`] = {};
        updates[`games/${gameId}/votes`] = {};
    }
    
    updates[`games/${gameId}/lastDayResult`] = dayResult;
    
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

// Copy game code
function copyGameCode() {
    const code = gameCodeSpan.textContent;
    navigator.clipboard.writeText(code).then(() => {
        alert('Game code copied!');
    });
}

// Leave game
async function leaveGame() {
    if (currentPlayerId && gameId) {
        await remove(ref(database, `games/${gameId}/players/${currentPlayerId}`));
    }
    window.location.href = window.location.pathname;
}

// Reset game
function resetGame() {
    window.location.href = window.location.pathname;
}

// Initialize on load
init();

