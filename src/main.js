import { pb, isLoggedIn, currentUser, signIn, signUp, signOut, onAuthChange } from './auth.js';

// ─── Nav UI ──────────────────────────────────────────────────────────────────

function updateNav() {
  const loggedIn = isLoggedIn();
  document.getElementById('navSignInBtn')?.classList.toggle('hidden', loggedIn);
  const userMenu = document.getElementById('navUserMenu');
  if (userMenu) {
    userMenu.classList.toggle('hidden', !loggedIn);
    userMenu.classList.toggle('flex', loggedIn);
  }
  if (loggedIn) {
    const user = currentUser();
    const name = user.name || user.email.split('@')[0];
    document.getElementById('navUsername').textContent = name;
    document.getElementById('avatarCircle').textContent = name[0].toUpperCase();
    document.getElementById('dropdownEmail').textContent = user.email;
  }
}

onAuthChange(updateNav);
updateNav();

// ─── Auth modal ──────────────────────────────────────────────────────────────

let currentTab = 'signin';

window.openAuthModal = (tab = 'signin') => {
  switchTab(tab);
  clearAuthError();
  const modal = document.getElementById('authModal');
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  document.body.style.overflow = 'hidden';
  setTimeout(() => document.getElementById('inputEmail')?.focus(), 50);
};

window.closeAuthModal = () => {
  document.getElementById('authModal').classList.add('hidden');
  document.getElementById('authModal').classList.remove('flex');
  document.body.style.overflow = '';
  document.getElementById('authForm')?.reset();
  clearAuthError();
};

window.switchTab = (tab) => {
  currentTab = tab;
  const isSignup = tab === 'signup';
  document.getElementById('tabSignin').className = `flex-1 py-1.5 rounded-md text-sm font-semibold transition-colors ${!isSignup ? 'bg-white text-slate-950' : 'text-slate-400 hover:text-white'}`;
  document.getElementById('tabSignup').className = `flex-1 py-1.5 rounded-md text-sm font-semibold transition-colors ${isSignup ? 'bg-white text-slate-950' : 'text-slate-400 hover:text-white'}`;
  document.getElementById('fieldName').classList.toggle('hidden', !isSignup);
  document.getElementById('fieldPasswordConfirm').classList.toggle('hidden', !isSignup);
  document.getElementById('authSubmitBtn').textContent = isSignup ? 'Create Account' : 'Sign In';
  clearAuthError();
};

window.handleAuthSubmit = async (e) => {
  e.preventDefault();
  const btn = document.getElementById('authSubmitBtn');
  const email = document.getElementById('inputEmail').value.trim();
  const password = document.getElementById('inputPassword').value;
  clearAuthError();
  btn.disabled = true;
  btn.textContent = currentTab === 'signup' ? 'Creating account…' : 'Signing in…';

  try {
    if (currentTab === 'signup') {
      const name = document.getElementById('inputName').value.trim();
      const confirm = document.getElementById('inputPasswordConfirm').value;
      if (password !== confirm) { showAuthError('Passwords do not match.'); return; }
      await signUp(email, password, name);
    } else {
      await signIn(email, password);
    }
    closeAuthModal();
  } catch (err) {
    const msg = err?.response?.message || err?.message || 'Something went wrong.';
    if (msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('credentials')) {
      showAuthError('Invalid email or password.');
    } else if (msg.toLowerCase().includes('already exists') || msg.toLowerCase().includes('unique')) {
      showAuthError('An account with this email already exists.');
    } else {
      showAuthError(msg);
    }
  } finally {
    btn.disabled = false;
    btn.textContent = currentTab === 'signup' ? 'Create Account' : 'Sign In';
  }
};

window.signOut = () => {
  signOut();
  document.getElementById('userDropdown')?.classList.add('hidden');
};

function showAuthError(msg) {
  const el = document.getElementById('authError');
  el.textContent = msg;
  el.classList.remove('hidden');
}

function clearAuthError() {
  document.getElementById('authError')?.classList.add('hidden');
}

// ─── User dropdown ───────────────────────────────────────────────────────────

window.toggleUserDropdown = () => {
  document.getElementById('userDropdown')?.classList.toggle('hidden');
};

document.addEventListener('click', (e) => {
  if (!document.getElementById('avatarBtn')?.contains(e.target)) {
    document.getElementById('userDropdown')?.classList.add('hidden');
  }
});

// ─── Upgrade modal ───────────────────────────────────────────────────────────

window.openUpgradeModal = () => {
  document.getElementById('upgradeModal').classList.remove('hidden');
  document.getElementById('upgradeModal').classList.add('flex');
  document.body.style.overflow = 'hidden';
};

window.closeUpgradeModal = () => {
  document.getElementById('upgradeModal').classList.add('hidden');
  document.getElementById('upgradeModal').classList.remove('flex');
  document.body.style.overflow = '';
};

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { closeAuthModal(); closeUpgradeModal(); }
});
