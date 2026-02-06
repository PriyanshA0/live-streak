// LinkedIn Zip puzzle game logic: sequential path with DFS validation

const API_BASE = window.API_BASE || 'http://localhost:5000/api';

const puzzleData = {
  grid: [
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 5, 0, 0, 7, 0],
    [0, 0, 0, 2, 0, 0, 0],
    [0, 0, 3, 0, 0, 0, 0],
    [0, 0, 4, 0, 0, 0, 0],
    [0, 0, 0, 0, 1, 0, 0],
    [0, 0, 6, 0, 0, 0, 0]
  ],
  order: [1, 2, 3, 4, 5, 6, 7]
};

const DIRECTIONS = [
  { r: 1, c: 0 },
  { r: -1, c: 0 },
  { r: 0, c: 1 },
  { r: 0, c: -1 }
];

const ROWS = puzzleData.grid.length;
const COLS = puzzleData.grid[0].length;
const numberPositions = mapNumberPositions();

const puzzleState = {
  orderIndex: 0,
  path: [],
  visited: createVisitedMatrix(),
  isDragging: false,
  isLocked: false,
  solved: false,
  timerInterval: null,
  startTime: null
};

let hasInitializedPuzzle = false;
let queuedAvailability = null;
const DEFAULT_LOCK_MESSAGE = 'Locked · come back soon';
let lockMessageText = DEFAULT_LOCK_MESSAGE;

function mapNumberPositions() {
  const positions = {};
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const value = puzzleData.grid[r][c];
      if (value > 0) positions[value] = { r, c };
    }
  }
  return positions;
}

function createVisitedMatrix() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(false));
}

function validatePuzzleLayout() {
  const startNumber = puzzleData.order[0];
  const startPos = numberPositions[startNumber];
  if (!startPos) return false;
  const visited = createVisitedMatrix();
  visited[startPos.r][startPos.c] = true;
  return dfsSolve(startPos.r, startPos.c, 0, visited);
}

function dfsSolve(r, c, orderIndex, visited) {
  if (orderIndex === puzzleData.order.length - 1) return true;
  const nextNumber = puzzleData.order[orderIndex + 1];
  for (const dir of DIRECTIONS) {
    const nr = r + dir.r;
    const nc = c + dir.c;
    if (!isInside(nr, nc) || visited[nr][nc]) continue;
    const cellValue = puzzleData.grid[nr][nc];
    if (cellValue === nextNumber) {
      visited[nr][nc] = true;
      if (dfsSolve(nr, nc, orderIndex + 1, visited)) return true;
      visited[nr][nc] = false;
    } else if (cellValue === 0) {
      visited[nr][nc] = true;
      if (dfsSolve(nr, nc, orderIndex, visited)) return true;
      visited[nr][nc] = false;
    }
  }
  return false;
}

function renderPuzzle(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  const table = document.createElement('table');
  table.className = 'puzzle-grid';
  for (let r = 0; r < puzzleData.grid.length; r++) {
    const tr = document.createElement('tr');
    for (let c = 0; c < puzzleData.grid[r].length; c++) {
      const td = document.createElement('td');
      td.className = 'puzzle-cell';
      const val = puzzleData.grid[r][c];
      if (val > 0) {
        td.textContent = val;
        td.classList.add('puzzle-dot');
      }
      td.dataset.row = r;
      td.dataset.col = c;
      tr.appendChild(td);
    }
    table.appendChild(tr);
  }
  container.appendChild(table);
}

function resetPuzzleState() {
  puzzleState.orderIndex = 0;
  puzzleState.path = [];
  puzzleState.visited = createVisitedMatrix();
  puzzleState.isDragging = false;
  puzzleState.solved = false;
  stopTimer();
  setTimerText('00:00');
  document.querySelectorAll('.puzzle-cell').forEach(cell => {
    cell.classList.remove('puzzle-path', 'puzzle-wrong', 'puzzle-complete');
  });
}

function resetPuzzle() {
  const container = document.getElementById('gameArea');
  if (!container) return;
  renderPuzzle('gameArea');
  bindCellHandlers();
  resetPuzzleState();
}

function bindCellHandlers() {
  const cells = document.querySelectorAll('.puzzle-cell');
  cells.forEach(cell => {
    cell.addEventListener('mousedown', handlePointerDown);
    cell.addEventListener('mouseover', handlePointerOver);
    cell.addEventListener('mouseup', handlePointerUp);
    cell.addEventListener('touchstart', handleTouchStart, { passive: true });
  });
  const grid = document.querySelector('.puzzle-grid');
  if (grid) {
    grid.addEventListener('mouseleave', () => { puzzleState.isDragging = false; });
  }
}

function handlePointerDown(event) {
  if (puzzleState.isLocked) return;
  puzzleState.isDragging = true;
  processCellFromEvent(event);
}

function handlePointerOver(event) {
  if (!puzzleState.isDragging || puzzleState.isLocked) return;
  processCellFromEvent(event);
}

function handlePointerUp() {
  puzzleState.isDragging = false;
}

function handleTouchStart(event) {
  if (puzzleState.isLocked) return;
  processCellFromEvent(event);
}

function processCellFromEvent(event) {
  const cell = event.target.closest('.puzzle-cell');
  if (!cell) return;
  const r = Number(cell.dataset.row);
  const c = Number(cell.dataset.col);
  if (Number.isNaN(r) || Number.isNaN(c)) return;
  attemptMove(r, c);
}

function attemptMove(r, c) {
  if (puzzleState.solved || puzzleState.isLocked) return;
  const value = puzzleData.grid[r][c];
  const nextNumber = puzzleData.order[puzzleState.orderIndex];
  const pathLength = puzzleState.path.length;
  const lastStep = pathLength ? puzzleState.path[pathLength - 1] : null;

  if (pathLength > 1) {
    const previousStep = puzzleState.path[pathLength - 2];
    if (previousStep.r === r && previousStep.c === c) {
      undoLastStep();
      return;
    }
  }

  if (!lastStep) {
    if (value !== nextNumber) {
      flagCell(r, c);
      return;
    }
    startTimer();
    commitStep(r, c);
    puzzleState.orderIndex += 1;
    checkCompletion();
    return;
  }

  if (!isAdjacent(r, c, lastStep.r, lastStep.c)) {
    flagCell(r, c);
    return;
  }

  if (puzzleState.visited[r][c]) {
    flagCell(r, c);
    return;
  }

  if (value > 0) {
    if (value !== nextNumber) {
      flagCell(r, c);
      return;
    }
    commitStep(r, c);
    puzzleState.orderIndex += 1;
    checkCompletion();
    return;
  }

  commitStep(r, c);
}

function commitStep(r, c) {
  puzzleState.path.push({ r, c });
  puzzleState.visited[r][c] = true;
  highlightCell(r, c);
}

function undoLastStep() {
  const last = puzzleState.path.pop();
  if (!last) return;
  puzzleState.visited[last.r][last.c] = false;
  unhighlightCell(last.r, last.c);
  const value = puzzleData.grid[last.r][last.c];
  if (value > 0 && puzzleState.orderIndex > 0) {
    puzzleState.orderIndex -= 1;
  }
  if (puzzleState.path.length === 0) {
    stopTimer();
    setTimerText('00:00');
  }
}

function highlightCell(r, c) {
  const cell = getCellElement(r, c);
  if (cell) cell.classList.add('puzzle-path');
}

function unhighlightCell(r, c) {
  const cell = getCellElement(r, c);
  if (cell) cell.classList.remove('puzzle-path', 'puzzle-complete');
}

function flagCell(r, c) {
  const cell = getCellElement(r, c);
  if (!cell) return;
  cell.classList.add('puzzle-wrong');
  setTimeout(() => cell.classList.remove('puzzle-wrong'), 450);
}

function getCellElement(r, c) {
  return document.querySelector(`.puzzle-cell[data-row='${r}'][data-col='${c}']`);
}

function isAdjacent(r1, c1, r2, c2) {
  return Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1;
}

function isInside(r, c) {
  return r >= 0 && c >= 0 && r < ROWS && c < COLS;
}

function checkCompletion() {
  if (puzzleState.orderIndex !== puzzleData.order.length) return;
  puzzleState.solved = true;
  stopTimer();
  puzzleState.path.forEach(({ r, c }) => {
    const cell = getCellElement(r, c);
    if (cell) cell.classList.add('puzzle-complete');
  });
  setTimeout(() => {
    notifyBackendOfCompletion();
  }, 250);
}

function notifyBackendOfCompletion() {
  const timerEl = document.getElementById('timer');
  const elapsedText = timerEl ? timerEl.textContent : '';
  const token = localStorage.getItem('token');
  const finish = (prefix) => {
    const base = `Puzzle Complete! Time: ${elapsedText}`;
    alert(prefix ? `${prefix}\n${base}` : base);
  };
  if (!token) {
    lockAfterCompletion('LinkedIn Zip solved!\nSign in to track streaks.');
    finish();
    return;
  }
  lockAfterCompletion('LinkedIn Zip solved!\nSyncing streak...');
  fetch(`${API_BASE}/game/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    }
  })
    .then(res => res.json().then(data => ({ ok: res.ok, data })))
    .then(({ ok, data }) => {
      if (!ok) {
        const msg = data.message || 'Unable to record completion.';
        setLockMessage(`LinkedIn Zip solved!\n${msg}`);
        finish(msg);
        return;
      }
      document.dispatchEvent(new CustomEvent('puzzle:completed', { detail: data }));
      setLockMessage(buildSolvedMessage(data.streak, data.nextUnlockIn || data.unlocksIn));
      finish();
    })
    .catch(() => {
      setLockMessage('LinkedIn Zip solved!\nProgress will sync once you reconnect.');
      finish('Unable to reach the server. Progress will sync once you reconnect.');
    });
}

function lockAfterCompletion(message) {
  puzzleState.isLocked = true;
  toggleGameLock(true, message || 'LinkedIn Zip solved!\nSyncing streak...');
}

function startTimer() {
  if (puzzleState.timerInterval) return;
  puzzleState.startTime = Date.now();
  updateTimerDisplay();
  puzzleState.timerInterval = setInterval(updateTimerDisplay, 500);
}

function stopTimer() {
  if (puzzleState.timerInterval) clearInterval(puzzleState.timerInterval);
  puzzleState.timerInterval = null;
  puzzleState.startTime = null;
}

function setTimerText(text) {
  const timerEl = document.getElementById('timer');
  if (timerEl) timerEl.textContent = text;
}

function updateTimerDisplay() {
  if (!puzzleState.startTime) return;
  const elapsed = Math.floor((Date.now() - puzzleState.startTime) / 1000);
  const min = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const sec = String(elapsed % 60).padStart(2, '0');
  setTimerText(`${min}:${sec}`);
}

function toggleGameLock(locked, message) {
  const area = document.getElementById('gameArea');
  if (!area) return;
  if (locked) {
    if (message) {
      lockMessageText = message;
    }
    area.dataset.lockMessage = lockMessageText || DEFAULT_LOCK_MESSAGE;
    area.classList.add('locked');
    return;
  }
  area.classList.remove('locked');
  delete area.dataset.lockMessage;
  lockMessageText = DEFAULT_LOCK_MESSAGE;
}

function setLockMessage(message) {
  lockMessageText = message || DEFAULT_LOCK_MESSAGE;
  const area = document.getElementById('gameArea');
  if (area && area.classList.contains('locked')) {
    area.dataset.lockMessage = lockMessageText;
  }
}

function buildSolvedMessage(streak, unlocksIn) {
  const lines = ['LinkedIn Zip solved!'];
  if (typeof streak === 'number' && streak > 0) {
    lines.push(`🔥 Day ${streak} secured.`);
  }
  if (Number.isFinite(unlocksIn) && unlocksIn >= 0) {
    lines.push(`Next puzzle in ${formatCountdown(unlocksIn)}.`);
  } else {
    lines.push('Next puzzle unlocks in 20h.');
  }
  return lines.join('\n');
}

function buildCountdownMessage(unlocksIn) {
  if (Number.isFinite(unlocksIn) && unlocksIn > 0) {
    return `Locked · Next puzzle in ${formatCountdown(unlocksIn)}`;
  }
  return DEFAULT_LOCK_MESSAGE;
}

function formatCountdown(ms) {
  if (!ms || ms <= 0) return 'moments';
  const totalSeconds = Math.ceil(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts = [];
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  if (!hours && !minutes) parts.push(`${seconds}s`);
  return parts.join(' ');
}

function initPuzzleGame() {
  const gameArea = document.getElementById('gameArea');
  if (!gameArea) return;
  hasInitializedPuzzle = true;
  resetPuzzle();
  const resetBtn = document.getElementById('resetPuzzleBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (!puzzleState.isLocked) resetPuzzle();
    });
  }
  document.addEventListener('mouseup', handlePointerUp);
  document.addEventListener('touchend', handlePointerUp);
  if (!validatePuzzleLayout()) {
    console.warn('Puzzle definition is currently unsolvable.');
  }
  if (queuedAvailability) {
    applyAvailability(queuedAvailability);
    queuedAvailability = null;
  }
}

function applyAvailability(status = {}) {
  const shouldLock = status.canPlay === false;
  const previouslyLocked = puzzleState.isLocked;
  puzzleState.isLocked = shouldLock;
  if (shouldLock) {
    const unlocksRaw = typeof status.unlocksIn === 'number' ? status.unlocksIn : Number(status.unlocksIn);
    const unlocksIn = Number.isFinite(unlocksRaw) ? unlocksRaw : undefined;
    const message = status.lockMessage
      || (status.streak ? buildSolvedMessage(status.streak, unlocksIn) : buildCountdownMessage(unlocksIn));
    toggleGameLock(true, message);
    stopTimer();
    setTimerText('00:00');
    return;
  }
  toggleGameLock(false);
  if (previouslyLocked) {
    resetPuzzle();
  }
}

const PuzzleGame = {
  setAvailability(status = {}) {
    if (!hasInitializedPuzzle) {
      queuedAvailability = status;
      return;
    }
    applyAvailability(status);
  }
};

window.PuzzleGame = PuzzleGame;

document.addEventListener('DOMContentLoaded', () => {
  initPuzzleGame();
  if (window.pendingGameStatus) {
    PuzzleGame.setAvailability(window.pendingGameStatus);
    window.pendingGameStatus = null;
  }
});
