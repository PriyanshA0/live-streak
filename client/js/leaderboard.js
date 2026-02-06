// Fetch and render leaderboard

const API_BASE = window.API_BASE || 'http://localhost:5000/api';

document.addEventListener('DOMContentLoaded', () => {
  fetch(`${API_BASE}/leaderboard/top`)
    .then(res => res.json())
    .then(data => {
      const tbody = document.querySelector('#leaderboardTable tbody');
      tbody.innerHTML = '';
      data.forEach((user, i) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${i+1}</td><td>${user.username}</td><td>${user.streak}</td><td>${user.xp}</td>`;
        tbody.appendChild(tr);
      });
    });
});