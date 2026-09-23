// Módulo de autenticación compartido (login/registro con el servicio de usuarios)
const AUTH = (() => {
  const TOKEN_KEY = 'arco_token';
  const EMAIL_KEY = 'arco_email';

  const getToken = () => { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } };
  const getEmail = () => { try { return localStorage.getItem(EMAIL_KEY); } catch { return null; } };
  const isLogged = () => !!getToken();

  function setSession(token, email) {
    try { localStorage.setItem(TOKEN_KEY, token); localStorage.setItem(EMAIL_KEY, email); } catch {}
    renderAccount();
  }
  function logout() {
    try { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(EMAIL_KEY); } catch {}
    renderAccount();
  }

  // Pinta el estado de la cuenta en el header (elemento con id="account")
  function renderAccount() {
    const el = document.getElementById('account');
    if (!el) return;
    if (isLogged()) {
      el.innerHTML = `<span class="acc-email">${getEmail()}</span> <a class="acc-link" id="logoutBtn">Salir</a>`;
      el.querySelector('#logoutBtn').onclick = logout;
    } else {
      el.innerHTML = `<a class="acc-link" id="loginBtn">Iniciar sesión</a>`;
      el.querySelector('#loginBtn').onclick = () => openModal();
    }
  }

  // Modal de login/registro
  function openModal(afterLogin) {
    let ov = document.getElementById('auth-overlay');
    if (!ov) {
      ov = document.createElement('div');
      ov.id = 'auth-overlay';
      ov.className = 'overlay';
      ov.innerHTML = '<div class="modal" id="auth-modal"></div>';
      document.body.appendChild(ov);
      ov.addEventListener('click', e => { if (e.target === ov) ov.classList.remove('open'); });
    }
    drawLogin(ov, afterLogin);
    ov.classList.add('open');
  }

  function drawLogin(ov, afterLogin, mode = 'login') {
    const modal = ov.querySelector('#auth-modal');
    const isLogin = mode === 'login';
    modal.innerHTML = `
      <span class="close" id="auth-close">&times;</span>
      <h3>${isLogin ? 'Iniciar sesión' : 'Crear cuenta'}</h3>
      <div class="field"><label>Correo electrónico</label><input id="au-email" type="email" placeholder="tu@correo.com"></div>
      <div class="field"><label>Contraseña</label><input id="au-pass" type="password" placeholder="••••••••"></div>
      <p class="auth-error" id="au-error"></p>
      <button class="btn-primary" id="au-submit">${isLogin ? 'Entrar' : 'Registrarme'}</button>
      <p class="note">
        ${isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
        <a class="acc-link" id="au-switch">${isLogin ? 'Regístrate' : 'Inicia sesión'}</a>
      </p>`;
    modal.querySelector('#auth-close').onclick = () => ov.classList.remove('open');
    modal.querySelector('#au-switch').onclick = () => drawLogin(ov, afterLogin, isLogin ? 'register' : 'login');
    modal.querySelector('#au-submit').onclick = () => submit(ov, isLogin, afterLogin);
  }

  async function submit(ov, isLogin, afterLogin) {
    const email = ov.querySelector('#au-email').value.trim();
    const pass = ov.querySelector('#au-pass').value;
    const err = ov.querySelector('#au-error');
    err.textContent = '';
    if (!email || !pass) { err.textContent = 'Completa email y contraseña.'; return; }
    const btn = ov.querySelector('#au-submit');
    btn.disabled = true; btn.textContent = 'Procesando…';
    try {
      if (!isLogin) {
        const rr = await fetch('/api/users/register', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password: pass })
        });
        if (!rr.ok) {
          const d = await rr.json().catch(() => ({}));
          throw new Error(d.detail || 'No se pudo registrar');
        }
      }
      // login (form-urlencoded que espera OAuth2PasswordRequestForm)
      const body = new URLSearchParams({ username: email, password: pass });
      const lr = await fetch('/api/users/login', {
        method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body
      });
      if (!lr.ok) throw new Error('Credenciales inválidas');
      const data = await lr.json();
      setSession(data.access_token, email);
      ov.classList.remove('open');
      if (typeof afterLogin === 'function') afterLogin();
    } catch (e) {
      err.textContent = e.message || 'Error';
      btn.disabled = false; btn.textContent = isLogin ? 'Entrar' : 'Registrarme';
    }
  }

  document.addEventListener('DOMContentLoaded', renderAccount);
  return { getToken, getEmail, isLogged, openModal, logout, renderAccount };
})();
