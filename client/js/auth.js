// Handles login and signup forms


const API_BASE = window.API_BASE || 'http://localhost:5000/api';
const AUTH_BASE = `${API_BASE}/auth`;

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const loading = document.getElementById('loadingOverlay');
      if (loading) loading.style.display = 'flex';
      try {
        const res = await fetch(`${AUTH_BASE}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (data.token) {
          localStorage.setItem('token', data.token);
          window.location.href = 'dashboard.html';
        } else {
          alert(data.message || 'Login failed');
        }
      } catch (err) {
        alert('Login failed. Please try again.');
      } finally {
        if (loading) loading.style.display = 'none';
      }
    });
  }

  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const loading = document.getElementById('loadingOverlay');
      if (loading) loading.style.display = 'flex';
      try {
        const res = await fetch(`${AUTH_BASE}/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (data.token) {
          localStorage.setItem('token', data.token);
          window.location.href = 'dashboard.html';
        } else {
          alert(data.message || 'Signup failed');
        }
      } catch (err) {
        alert('Signup failed. Please try again.');
      } finally {
        if (loading) loading.style.display = 'none';
      }
    });
  }
});