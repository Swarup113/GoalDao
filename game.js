// game.js

// ==================== CONFIGURATION ====================
const CONFIG = {
    ASPECT_RATIO: 380 / 600, // Width / Height
    INTERNAL_WIDTH: 380,
    INTERNAL_HEIGHT: 600,
    PLAYER_RADIUS: 20,
    BALL_RADIUS: 10,
    GOAL_WIDTH: 100,
    GOAL_DEPTH: 45, // Increased depth for easier shooting
    PASS_SPEED: 14,
    MIN_PLAYER_DIST: 50
};

const COLORS = {
    field: '#14532d',
    fieldDark: '#0f3d1f',
    fieldLines: '#22c55e',
    teamBlue: '#2563eb',
    teamBlueLight: '#3b82f6',
    teamBlueSelected: '#60a5fa',
    teamRed: '#dc2626',
    teamRedLight: '#ef4444',
    teamRedSelected: '#f87171',
    ball: '#ffffff',
    ballPattern: '#1a1a1a',
    goalPost: '#ffffff',
    goalNet: 'rgba(255, 255, 255, 0.1)',
    passLine: 'rgba(255, 255, 255, 0.6)'
};

// ==================== GAME STATE ====================
let gameState = {
    players: [],
    ball: { x: 0, y: 0 },
    ballOwner: null,
    selectedPlayer: null,
    currentPlayer: 1, // 1 = Blue, 2 = Red
    scores: [0, 0],
    teamNames: ['Team 1', 'Team 2'],
    gameTime: 5,
    timeLeft: 5 * 60,
    isRunning: false,
    gameOver: false,
    isAnimating: false
};

let canvas = null;
let ctx = null;
let timerInterval = null;
let animationFrame = null;
let passTarget = null; 

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    setupLandingPage();
    setupGamePage();
    setupModals();
}

function setupLandingPage() {
    const startBtn = document.getElementById('start-btn');
    const rulesBtn = document.getElementById('rules-btn');
    const timeButtons = document.querySelectorAll('.time-btn');
    
    startBtn.addEventListener('click', startGame);
    rulesBtn.addEventListener('click', () => showModal('rules-modal'));
    
    timeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            timeButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            gameState.gameTime = parseInt(btn.dataset.time);
        });
    });
}

function setupGamePage() {
    const backBtn = document.getElementById('back-btn');
    backBtn.addEventListener('click', returnToMenu);
}

function setupModals() {
    const closeRules = document.getElementById('close-rules');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const playAgainBtn = document.getElementById('play-again-btn');
    const menuBtn = document.getElementById('menu-btn');
    
    closeRules.addEventListener('click', () => hideModal('rules-modal'));
    closeModalBtn.addEventListener('click', () => hideModal('rules-modal'));
    
    playAgainBtn.addEventListener('click', () => {
        hideModal('gameover-modal');
        resetGame();
        startGame();
    });
    
    menuBtn.addEventListener('click', () => {
        hideModal('gameover-modal');
        returnToMenu();
    });
    
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
        backdrop.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) hideModal(modal.id);
        });
    });
}

// ==================== PAGE NAVIGATION ====================
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
}

function showModal(modalId) { document.getElementById(modalId).classList.add('show'); }
function hideModal(modalId) { document.getElementById(modalId).classList.remove('show'); }

function returnToMenu() {
    stopTimer();
    gameState.isRunning = false;
    if (animationFrame) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
    }
    showPage('landing-page');
}

// ==================== GAME START ====================
function startGame() {
    const team1Input = document.getElementById('team1-name');
    const team2Input = document.getElementById('team2-name');
    
    gameState.teamNames[0] = team1Input.value.trim() || 'Team 1';
    gameState.teamNames[1] = team2Input.value.trim() || 'Team 2';
    gameState.timeLeft = gameState.gameTime * 60;
    gameState.isRunning = true;
    gameState.gameOver = false;
    gameState.isAnimating = false;
    gameState.selectedPlayer = null;
    gameState.currentPlayer = 1; // Blue starts
    
    updateDisplayNames();
    resetScores();
    showPage('game-page');
    initializeCanvas();
    initializePlayers(1); // Blue GK starts with ball
    startTimer();
    render();
}

function resetGame() {
    gameState.scores = [0, 0];
    gameState.currentPlayer = 1;
    updateScoreDisplay();
}

function resetScores() {
    gameState.scores = [0, 0];
    updateScoreDisplay();
    updateTurnIndicator();
}

function updateDisplayNames() {
    document.getElementById('team1-display').textContent = gameState.teamNames[0];
    document.getElementById('team2-display').textContent = gameState.teamNames[1];
    document.getElementById('final-team1').textContent = gameState.teamNames[0];
    document.getElementById('final-team2').textContent = gameState.teamNames[1];
}

// ==================== CANVAS SETUP ====================
function initializeCanvas() {
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');
    
    // Set internal resolution
    canvas.width = CONFIG.INTERNAL_WIDTH;
    canvas.height = CONFIG.INTERNAL_HEIGHT;
    
    // Input listeners
    canvas.removeEventListener('mousedown', handleCanvasClick);
    canvas.removeEventListener('mousemove', handleCanvasHover);
    canvas.removeEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.removeEventListener('touchmove', handleTouchMove, { passive: false });
    
    canvas.addEventListener('mousedown', handleCanvasClick);
    canvas.addEventListener('mousemove', handleCanvasHover);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('mouseleave', handleCanvasLeave);
}

// Helper to get coordinates for both mouse and touch
function getEventPos(e) {
    const rect = canvas.getBoundingClientRect();
    // Scale factor: Canvas internal vs DOM element size
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    let clientX, clientY;
    
    if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }
    
    return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
    };
}

// ==================== PLAYER INITIALIZATION ====================
function initializePlayers(startingTeamNum = 1) {
    gameState.players = [];
    
    const goalCenterX = CONFIG.INTERNAL_WIDTH / 2;
    
    // Blue GK (Team 1) - Defends Top Goal
    const blueGK = {
        x: goalCenterX,
        y: CONFIG.GOAL_DEPTH + CONFIG.PLAYER_RADIUS + 5,
        team: 1,
        isGoalkeeper: true,
        id: 'blue-gk'
    };
    gameState.players.push(blueGK);
    
    // Red GK (Team 2) - Defends Bottom Goal
    const redGK = {
        x: goalCenterX,
        y: CONFIG.INTERNAL_HEIGHT - CONFIG.GOAL_DEPTH - CONFIG.PLAYER_RADIUS - 5,
        team: 2,
        isGoalkeeper: true,
        id: 'red-gk'
    };
    gameState.players.push(redGK);
    
    const fieldMargin = CONFIG.PLAYER_RADIUS + 5;
    const goalAreaTop = CONFIG.GOAL_DEPTH + 60; 
    const goalAreaBottom = CONFIG.INTERNAL_HEIGHT - CONFIG.GOAL_DEPTH - 60;
    
    // Add 10 blue outfield players
    for (let i = 0; i < 10; i++) {
        let pos = findValidPosition(fieldMargin, goalAreaTop, goalAreaBottom);
        gameState.players.push({
            x: pos.x,
            y: pos.y,
            team: 1,
            isGoalkeeper: false,
            id: `blue-${i}`
        });
    }
    
    // Add 10 red outfield players
    for (let i = 0; i < 10; i++) {
        let pos = findValidPosition(fieldMargin, goalAreaTop, goalAreaBottom);
        gameState.players.push({
            x: pos.x,
            y: pos.y,
            team: 2,
            isGoalkeeper: false,
            id: `red-${i}`
        });
    }
    
    // Give ball to the specified starting team's GK
    const startingGK = gameState.players.find(p => p.team === startingTeamNum && p.isGoalkeeper);
    gameState.ballOwner = startingGK;
    gameState.ball = { x: startingGK.x, y: startingGK.y };
    gameState.currentPlayer = startingTeamNum;
    updateTurnIndicator();
}

function findValidPosition(margin, topBound, bottomBound) {
    let attempts = 0;
    const maxAttempts = 200;
    
    while (attempts < maxAttempts) {
        const x = margin + Math.random() * (CONFIG.INTERNAL_WIDTH - 2 * margin);
        const y = topBound + Math.random() * (bottomBound - topBound);
        
        let valid = true;
        
        for (const player of gameState.players) {
            const dist = Math.sqrt((x - player.x) ** 2 + (y - player.y) ** 2);
            if (dist < CONFIG.MIN_PLAYER_DIST) {
                valid = false;
                break;
            }
        }
        
        if (valid) return { x, y };
        attempts++;
    }
    
    return {
        x: margin + Math.random() * (CONFIG.INTERNAL_WIDTH - 2 * margin),
        y: (topBound + bottomBound) / 2
    };
}

// ==================== RENDERING ====================
function render() {
    if (!ctx || !canvas) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    drawField();
    drawGoals();
    drawPlayers();
    drawBall();
    drawSelection();
    drawPassLine();
}

function drawField() {
    // Main field gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, COLORS.field);
    gradient.addColorStop(0.5, COLORS.fieldDark);
    gradient.addColorStop(1, COLORS.field);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = COLORS.fieldLines;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.3;
    
    // Center line
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
    
    // Center circle
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, 50, 0, Math.PI * 2);
    ctx.stroke();
    
    // Penalty areas
    const penaltyWidth = 160;
    const penaltyHeight = 70;
    const penaltyX = (canvas.width - penaltyWidth) / 2;
    
    ctx.strokeRect(penaltyX, CONFIG.GOAL_DEPTH, penaltyWidth, penaltyHeight);
    ctx.strokeRect(penaltyX, canvas.height - CONFIG.GOAL_DEPTH - penaltyHeight, penaltyWidth, penaltyHeight);
    
    ctx.globalAlpha = 1;
}

function drawGoals() {
    const goalCenterX = canvas.width / 2;
    
    // Top goal (Blue defends this, Red attacks this)
    ctx.fillStyle = COLORS.goalNet;
    ctx.fillRect(goalCenterX - CONFIG.GOAL_WIDTH / 2, 0, CONFIG.GOAL_WIDTH, CONFIG.GOAL_DEPTH);
    
    ctx.strokeStyle = COLORS.goalPost;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(goalCenterX - CONFIG.GOAL_WIDTH / 2, 0);
    ctx.lineTo(goalCenterX - CONFIG.GOAL_WIDTH / 2, CONFIG.GOAL_DEPTH);
    ctx.lineTo(goalCenterX + CONFIG.GOAL_WIDTH / 2, CONFIG.GOAL_DEPTH);
    ctx.lineTo(goalCenterX + CONFIG.GOAL_WIDTH / 2, 0);
    ctx.stroke();
    
    // Bottom goal (Red defends this, Blue attacks this)
    ctx.fillStyle = COLORS.goalNet;
    ctx.fillRect(goalCenterX - CONFIG.GOAL_WIDTH / 2, canvas.height - CONFIG.GOAL_DEPTH, CONFIG.GOAL_WIDTH, CONFIG.GOAL_DEPTH);
    
    ctx.beginPath();
    ctx.moveTo(goalCenterX - CONFIG.GOAL_WIDTH / 2, canvas.height);
    ctx.lineTo(goalCenterX - CONFIG.GOAL_WIDTH / 2, canvas.height - CONFIG.GOAL_DEPTH);
    ctx.lineTo(goalCenterX + CONFIG.GOAL_WIDTH / 2, canvas.height - CONFIG.GOAL_DEPTH);
    ctx.lineTo(goalCenterX + CONFIG.GOAL_WIDTH / 2, canvas.height);
    ctx.stroke();
}

function drawPlayers() {
    for (const player of gameState.players) {
        const isSelected = gameState.selectedPlayer === player;
        const hasBall = gameState.ballOwner === player;
        const isCurrentTeam = player.team === gameState.currentPlayer;
        
        ctx.beginPath();
        ctx.arc(player.x, player.y, CONFIG.PLAYER_RADIUS, 0, Math.PI * 2);
        
        // Colors
        if (player.team === 1) {
            ctx.fillStyle = isSelected ? COLORS.teamBlueSelected : (hasBall ? COLORS.teamBlueLight : COLORS.teamBlue);
        } else {
            ctx.fillStyle = isSelected ? COLORS.teamRedSelected : (hasBall ? COLORS.teamRedLight : COLORS.teamRed);
        }
        
        ctx.fill();
        
        // Glow for active team
        if (isCurrentTeam && !gameState.isAnimating) {
            ctx.shadowColor = player.team === 1 ? 'rgba(37, 99, 235, 0.6)' : 'rgba(220, 38, 38, 0.6)';
            ctx.shadowBlur = 10;
            ctx.fill();
            ctx.shadowBlur = 0;
        }
        
        // Border
        ctx.strokeStyle = hasBall ? '#ffffff' : 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = hasBall ? 3 : 2;
        ctx.stroke();
        
        // GK marker
        if (player.isGoalkeeper) {
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('GK', player.x, player.y);
        }
    }
}

function drawBall() {
    if (gameState.isAnimating) return;
    
    const ballX = gameState.ballOwner ? gameState.ballOwner.x : gameState.ball.x;
    const ballY = gameState.ballOwner ? gameState.ballOwner.y : gameState.ball.y;
    
    // Shadow
    ctx.beginPath();
    ctx.arc(ballX + 1, ballY + 1, CONFIG.BALL_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fill();
    
    // Ball
    ctx.beginPath();
    ctx.arc(ballX, ballY, CONFIG.BALL_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.ball;
    ctx.fill();
    ctx.strokeStyle = COLORS.ballPattern;
    ctx.lineWidth = 1;
    ctx.stroke();
}

function drawSelection() {
    if (!gameState.selectedPlayer || gameState.isAnimating) return;
    
    const player = gameState.selectedPlayer;
    
    ctx.beginPath();
    ctx.arc(player.x, player.y, CONFIG.PLAYER_RADIUS + 5, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
}

function drawPassLine() {
    if (!passTarget || gameState.isAnimating || !gameState.selectedPlayer) return;
    
    const player = gameState.selectedPlayer;
    
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(passTarget.x, passTarget.y);
    ctx.strokeStyle = COLORS.passLine;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.stroke();
    ctx.setLineDash([]);
}

// ==================== INPUT HANDLING ====================
function handleTouchStart(e) {
    e.preventDefault(); 
    const pos = getEventPos(e);
    handleInput(pos.x, pos.y);
}

function handleTouchMove(e) {
    e.preventDefault();
    const pos = getEventPos(e);
    handleHover(pos.x, pos.y);
}

function handleCanvasClick(e) {
    const pos = getEventPos(e);
    handleInput(pos.x, pos.y);
}

function handleCanvasHover(e) {
    const pos = getEventPos(e);
    handleHover(pos.x, pos.y);
}

function handleCanvasLeave() {
    passTarget = null;
    render();
}

function handleInput(x, y) {
    if (!gameState.isRunning || gameState.gameOver || gameState.isAnimating) return;
    
    const clickedPlayer = getPlayerAtPosition(x, y);
    
    // 1. Clicked on empty space
    if (!clickedPlayer) {
        if (gameState.selectedPlayer) {
            // Check if clicked inside opponent's goal
            const goalTarget = getGoalTarget(x, y);
            if (goalTarget) {
                attemptMove(goalTarget, true); // It's a shot
                return;
            }
        }
        // Deselect
        gameState.selectedPlayer = null;
        render();
        return;
    }
    
    // 2. Clicked on a player
    if (clickedPlayer.team === gameState.currentPlayer) {
        // Own team
        if (gameState.selectedPlayer && gameState.selectedPlayer !== clickedPlayer) {
            // Pass to teammate
            attemptMove(clickedPlayer, false);
        } else {
            // Select
            if (gameState.ballOwner === clickedPlayer || !gameState.ballOwner) {
                gameState.selectedPlayer = clickedPlayer;
                render();
            }
        }
    }
}

function handleHover(x, y) {
    if (!gameState.isRunning || gameState.gameOver || gameState.isAnimating) return;
    
    const hoveredPlayer = getPlayerAtPosition(x, y);
    
    // Hovering over teammate
    if (gameState.selectedPlayer && hoveredPlayer && 
        hoveredPlayer.team === gameState.currentPlayer && 
        hoveredPlayer !== gameState.selectedPlayer) {
        passTarget = hoveredPlayer;
        canvas.style.cursor = 'pointer';
    } 
    // Hovering over goal area
    else if (gameState.selectedPlayer && !hoveredPlayer) {
        const goalTarget = getGoalTarget(x, y);
        if (goalTarget) {
            passTarget = goalTarget;
            canvas.style.cursor = 'crosshair';
        } else {
            passTarget = null;
            canvas.style.cursor = 'default';
        }
    } 
    else {
        passTarget = null;
        canvas.style.cursor = (hoveredPlayer && hoveredPlayer.team === gameState.currentPlayer) ? 'pointer' : 'default';
    }
    
    render();
}

function getPlayerAtPosition(x, y) {
    for (const player of gameState.players) {
        const dist = Math.sqrt((x - player.x) ** 2 + (y - player.y) ** 2);
        if (dist <= CONFIG.PLAYER_RADIUS + 5) return player;
    }
    return null;
}

function getGoalTarget(x, y) {
    const goalCenterX = CONFIG.INTERNAL_WIDTH / 2;
    const halfWidth = CONFIG.GOAL_WIDTH / 2;
    
    // Blue Team (1) attacks BOTTOM goal
    if (gameState.currentPlayer === 1) {
        if (y >= CONFIG.INTERNAL_HEIGHT - CONFIG.GOAL_DEPTH && x >= goalCenterX - halfWidth && x <= goalCenterX + halfWidth) {
            return { x: x, y: y, isGoal: true };
        }
    }
    // Red Team (2) attacks TOP goal
    else if (gameState.currentPlayer === 2) {
        if (y <= CONFIG.GOAL_DEPTH && x >= goalCenterX - halfWidth && x <= goalCenterX + halfWidth) {
            return { x: x, y: y, isGoal: true };
        }
    }
    return null;
}

// ==================== GAME LOGIC ====================
function attemptMove(target, isShot) {
    if (!gameState.selectedPlayer) return;
    
    const fromPlayer = gameState.selectedPlayer;
    const interceptingPlayer = checkInterception(fromPlayer, target);
    
    if (interceptingPlayer) {
        animatePass(fromPlayer, interceptingPlayer, true, false);
    } else {
        animatePass(fromPlayer, target, false, isShot);
    }
}

function checkInterception(from, to) {
    const opponents = gameState.players.filter(p => p.team !== gameState.currentPlayer);
    
    for (const opponent of opponents) {
        const dist = pointToLineDistance(opponent, from, to);
        // If ball path passes too close to opponent
        if (dist < CONFIG.PLAYER_RADIUS + CONFIG.BALL_RADIUS) {
            return opponent;
        }
    }
    return null;
}

function pointToLineDistance(point, lineStart, lineEnd) {
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;
    
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    
    if (lenSq !== 0) param = dot / lenSq;
    
    let xx, yy;
    
    if (param < 0) { xx = lineStart.x; yy = lineStart.y; }
    else if (param > 1) { xx = lineEnd.x; yy = lineEnd.y; }
    else { xx = lineStart.x + param * C; yy = lineStart.y + param * D; }
    
    return Math.sqrt((point.x - xx) ** 2 + (point.y - yy) ** 2);
}

// ==================== ANIMATION ====================
function animatePass(from, to, intercepted, isGoal) {
    gameState.isAnimating = true;
    gameState.selectedPlayer = null;
    passTarget = null;
    
    const startX = from.x;
    const startY = from.y;
    const endX = to.x;
    const endY = to.y;
    
    const distance = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2);
    const duration = distance / CONFIG.PASS_SPEED;
    
    let startTime = null;
    
    function animate(timestamp) {
        if (!startTime) startTime = timestamp;
        
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / (duration * 16.67), 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        
        gameState.ball.x = startX + (endX - startX) * eased;
        gameState.ball.y = startY + (endY - startY) * eased;
        gameState.ballOwner = null;
        
        render();
        drawAnimatedBall();
        
        if (progress < 1) {
            animationFrame = requestAnimationFrame(animate);
        } else {
            if (isGoal) handleGoal();
            else if (intercepted) handleInterception(to);
            else handleSuccessfulPass(to);
        }
    }
    
    animationFrame = requestAnimationFrame(animate);
}

function drawAnimatedBall() {
    const ballX = gameState.ball.x;
    const ballY = gameState.ball.y;
    
    ctx.beginPath();
    ctx.arc(ballX + 2, ballY + 2, CONFIG.BALL_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(ballX, ballY, CONFIG.BALL_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.ball;
    ctx.fill();
    ctx.strokeStyle = COLORS.ballPattern;
    ctx.lineWidth = 1;
    ctx.stroke();
}

function handleGoal() {
    gameState.scores[gameState.currentPlayer - 1]++;
    updateScoreDisplay();
    showGoalAlert();
    
    const scoringTeam = gameState.currentPlayer;
    const concedingTeam = scoringTeam === 1 ? 2 : 1;
    
    setTimeout(() => {
        // Reset positions, conceding team GK starts
        initializePlayers(concedingTeam);
        gameState.isAnimating = false;
        render();
    }, 1800);
}

function handleInterception(interceptor) {
    gameState.ballOwner = interceptor;
    gameState.ball = { x: interceptor.x, y: interceptor.y };
    switchTurn();
    gameState.isAnimating = false;
    render();
}

function handleSuccessfulPass(target) {
    // If target is a player
    if (target.team) {
        gameState.ballOwner = target;
        gameState.ball = { x: target.x, y: target.y };
    } else {
        // Pass to empty space (shouldn't happen often with current logic but good fallback)
        gameState.ball = { x: target.x, y: target.y };
        switchTurn(); 
    }
    
    gameState.isAnimating = false;
    render();
}

function showGoalAlert() {
    const alert = document.getElementById('goal-alert');
    alert.classList.remove('show');
    void alert.offsetWidth;
    alert.classList.add('show');
    setTimeout(() => alert.classList.remove('show'), 1500);
}

// ==================== UI UPDATES ====================
function updateScoreDisplay() {
    document.getElementById('score1').textContent = gameState.scores[0];
    document.getElementById('score2').textContent = gameState.scores[1];
}

function updateTurnIndicator() {
    const turnDot = document.querySelector('.turn-dot');
    const turnText = document.getElementById('turn-text');
    
    turnDot.classList.remove('blue', 'red');
    turnDot.classList.add(gameState.currentPlayer === 1 ? 'blue' : 'red');
    turnText.textContent = `${gameState.teamNames[gameState.currentPlayer - 1]}'s Turn`;
}

function switchTurn() {
    gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
    gameState.selectedPlayer = null;
    updateTurnIndicator();
}

// ==================== TIMER ====================
function startTimer() {
    stopTimer();
    updateTimerDisplay();
    
    timerInterval = setInterval(() => {
        if (!gameState.isRunning) return;
        gameState.timeLeft--;
        updateTimerDisplay();
        if (gameState.timeLeft <= 0) endGame();
    }, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function updateTimerDisplay() {
    const minutes = Math.floor(gameState.timeLeft / 60);
    const seconds = gameState.timeLeft % 60;
    const timerEl = document.getElementById('timer');
    
    timerEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    if (gameState.timeLeft <= 60) timerEl.classList.add('timer-warning');
    else timerEl.classList.remove('timer-warning');
}

// ==================== GAME END ====================
function endGame() {
    gameState.isRunning = false;
    gameState.gameOver = true;
    stopTimer();
    if (animationFrame) cancelAnimationFrame(animationFrame);
    
    document.getElementById('final-score1').textContent = gameState.scores[0];
    document.getElementById('final-score2').textContent = gameState.scores[1];
    
    let winnerText = "It's a draw!";
    if (gameState.scores[0] > gameState.scores[1]) winnerText = `${gameState.teamNames[0]} wins!`;
    else if (gameState.scores[1] > gameState.scores[0]) winnerText = `${gameState.teamNames[1]} wins!`;
    
    document.getElementById('winner-text').textContent = winnerText;
    showModal('gameover-modal');
}