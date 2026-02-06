// Dashboard logic: fetch user stats, render challenge cards, handle logout

const API_BASE = window.API_BASE || 'http://localhost:5000/api';
const STREAK_GOAL = 100;

let authToken = null;
let countdownInterval = null;
let unlockTargetTs = null;
let currentStreakValue = 0;
let streakGoal = STREAK_GOAL;

document.addEventListener('DOMContentLoaded', () => {
  authToken = localStorage.getItem('token');
  if (!authToken) {
    window.location.href = 'login.html';
    return;
  }

  renderChallengeCards();
  hydrateProfile();
  hydrateGameStatus();

  document.getElementById('logoutBtn').onclick = () => {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
  };

  document.addEventListener('puzzle:completed', ({ detail }) => {
    if (!detail) return;
    updateStats(detail.streak, detail.xp, detail.username);
    renderStreakBoard(detail.streak);
    applyGameStatus({
      canPlay: false,
      unlocksIn: detail.nextUnlockIn || detail.unlocksIn || 0,
      streakGoal: detail.streakGoal
    });
  });
});

function hydrateProfile() {
  fetch(`${API_BASE}/user/profile`, {
    headers: { Authorization: 'Bearer ' + authToken }
  })
    .then(handleAuth)
    .then(res => res.json())
    .then(user => {
      updateStats(user.streak || 0, user.xp || 0, user.username);
      renderStreakBoard(user.streak || 0);
    })
    .catch(() => {
      renderStreakBoard(0);
    });
}

function hydrateGameStatus() {
  fetch(`${API_BASE}/game/status`, {
    headers: { Authorization: 'Bearer ' + authToken }
  })
    .then(handleAuth)
    .then(res => res.json())
    .then(status => {
      applyGameStatus(status);
    })
    .catch(() => {
      applyGameStatus({ canPlay: true });
    });
}

function renderChallengeCards() {
  const cards = [
    { name: 'Quiz', locked: false },
    { name: 'Puzzle', locked: false, id: 'puzzle' },
    { name: 'Memory', locked: true },
    { name: 'Math', locked: true }
  ];
  const challengeCards = document.getElementById('challengeCards');
  challengeCards.innerHTML = '';
  cards.forEach(card => {
    const div = document.createElement('div');
    div.className = 'card' + (card.locked ? ' locked' : '');
    if (card.id) div.dataset.challenge = card.id;
    div.textContent = card.name + (card.locked ? ' (Locked)' : '');
    challengeCards.appendChild(div);
  });
}

function updateStats(streak, xp, username) {
  const streakEl = document.getElementById('streakCount');
  const xpEl = document.getElementById('xpCount');
  const gamerTagEl = document.getElementById('gamerTag');
  currentStreakValue = Number(streak) || 0;
  if (streakEl) streakEl.textContent = currentStreakValue;
  if (xpEl) xpEl.textContent = xp ?? 0;
  if (gamerTagEl && username) gamerTagEl.textContent = username;
}

function renderStreakBoard(streakValue = 0) {
  const grid = document.getElementById('streakGrid');
  if (!grid) return;
  const capped = Math.min(streakValue, streakGoal);
  grid.innerHTML = '';
  for (let day = 1; day <= streakGoal; day++) {
    const cell = document.createElement('div');
    cell.className = 'streak-day';
    if (day <= capped) cell.classList.add('completed');
    if (day === capped + 1) cell.classList.add('next');
    cell.textContent = day;
    grid.appendChild(cell);
  }
  const progressFill = document.getElementById('streakProgressFill');
  const progressLabel = document.getElementById('streakProgressLabel');
  if (progressFill) progressFill.style.width = `${(capped / streakGoal) * 100}%`;
  if (progressLabel) progressLabel.textContent = `${capped} / ${streakGoal} days`;
}

function applyGameStatus(status = {}) {
  const normalized = {
    canPlay: status.canPlay !== false,
    unlocksIn: status.unlocksIn || 0,
    nextUnlockAt: status.nextUnlockAt || null,
    streakGoal: status.streakGoal
  };
  if (typeof normalized.streakGoal === 'number' && normalized.streakGoal > 0 && normalized.streakGoal !== streakGoal) {
    streakGoal = normalized.streakGoal;
    renderStreakBoard(currentStreakValue);
  }
  updateStatusBanner(normalized);
  syncPuzzleAvailability(normalized);
  togglePuzzleCardLock(!normalized.canPlay);
}

function updateStatusBanner(status) {
  const banner = document.getElementById('gameStatusBanner');
  const text = document.getElementById('gameStatusText');
  if (!banner || !text) return;
  if (status.canPlay) {
    banner.classList.remove('locked');
    text.textContent = 'Puzzle ready. Complete today to grow your streak.';
    stopCountdown();
    return;
  }
  banner.classList.add('locked');
  startCountdown(status.unlocksIn);
}

function startCountdown(durationMs) {
  stopCountdown();
  const text = document.getElementById('gameStatusText');
  if (!durationMs || durationMs <= 0) {
    if (text) text.textContent = 'Unlocking momentarily...';
    return;
  }
  unlockTargetTs = Date.now() + durationMs;
  const tick = () => {
    const remaining = Math.max(unlockTargetTs - Date.now(), 0);
    if (text) text.textContent = `Next puzzle unlocks in ${formatDuration(remaining)}`;
    if (remaining <= 0) {
      stopCountdown();
      hydrateGameStatus();
    }
  };
  tick();
  countdownInterval = setInterval(tick, 1000);
}

function stopCountdown() {
  if (countdownInterval) clearInterval(countdownInterval);
  countdownInterval = null;
  unlockTargetTs = null;
}

function formatDuration(ms) {
  const totalSeconds = Math.ceil(ms / 1000);
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

function handleAuth(res) {
  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
    throw new Error('Unauthorized');
  }
  return res;
}

function syncPuzzleAvailability(status) {
  if (window.PuzzleGame && typeof window.PuzzleGame.setAvailability === 'function') {
    window.PuzzleGame.setAvailability(status);
  } else {
    window.pendingGameStatus = status;
  }
}

function togglePuzzleCardLock(locked) {
  const puzzleCard = document.querySelector('[data-challenge="puzzle"]');
  if (!puzzleCard) return;
  puzzleCard.classList.toggle('locked', locked);
  puzzleCard.textContent = locked ? 'Puzzle (Locked)' : 'Puzzle';
}