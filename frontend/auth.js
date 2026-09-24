// Módulo de autenticación compartido (login/registro con validación)
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

  function openModal(afterLogin) {
    let ov = document.getElementById('auth-overlay');
    if (!ov) {
      ov = document.createElement('div');
      ov.id = 'auth-overlay'; ov.className = 'overlay';
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
      <div class="field">
        <label>Correo electrónico</label>
        <input id="au-email" type="email" placeholder="tu@correo.com">
        <small class="field-err" id="err-email"></small>
      </div>
      <div class="field">
        <label>Contraseña</label>
        <div class="pass-wrap">
          <input id="au-pass" type="password" placeholder="••••••••">
          <button type="button" class="pass-toggle" id="au-toggle" aria-label="Mostrar contraseña">👁</button>
        </div>
        ${isLogin ? '' : '<small class="hint">Mínimo 8 caracteres, con mayúscula, minúscula y número.</small>'}
        <small class="field-err" id="err-pass"></small>
      </div>
      <p class="form-msg" id="au-error"></p>
      <button class="btn-primary" id="au-submit">${isLogin ? 'Entrar' : 'Registrarme'}</button>
      <p class="note">
        ${isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
        <a class="acc-link" id="au-switch">${isLogin ? 'Regístrate' : 'Inicia sesión'}</a>
      </p>`;

    modal.querySelector('#auth-close').onclick = () => ov.classList.remove('open');
    modal.querySelector('#au-switch').onclick = () => drawLogin(ov, afterLogin, isLogin ? 'register' : 'login');
    modal.querySelector('#au-submit').onclick = () => submit(ov, isLogin, afterLogin);

    // Mostrar/ocultar contraseña
    const tgl = modal.querySelector('#au-toggle');
    tgl.onclick = () => {
      const i = modal.querySelector('#au-pass'); const show = i.type === 'password';
      i.type = show ? 'text' : 'password'; tgl.textContent = show ? '🙈' : '👁';
    };

    // Validación en vivo (al salir del campo)
    const em = modal.querySelector('#au-email');
    const pw = modal.querySelector('#au-pass');
    em.addEventListener('blur', () => {
      const r = window.VALID.email(em.value);
      window.setFieldError('err-email', r.ok ? '' : r.msg);
    });
    pw.addEventListener('blur', () => {
      const r = window.VALID.password(pw.value, { strong: !isLogin });
      window.setFieldError('err-pass', r.ok ? '' : r.msg);
    });
  }

  async function submit(ov, isLogin, afterLogin) {
    const email = ov.querySelector('#au-email').value.trim();
    const pass = ov.querySelector('#au-pass').value;
    const err = ov.querySelector('#au-error');
    err.className = 'form-msg'; err.textContent = '';
    window.setFieldError('err-email', ''); window.setFieldError('err-pass', '');

    // --- Validación previa (no se envía a la API si falla) ---
    const ve = window.VALID.email(email);
    if (!ve.ok) { window.setFieldError('err-email', ve.msg); return; }
    const vp = window.VALID.password(pass, { strong: !isLogin });
    if (!vp.ok) { window.setFieldError('err-pass', vp.msg); return; }

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
      const body = new URLSearchParams({ username: email, password: pass });
      const lr = await fetch('/api/users/login', {
        method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body
      });
      if (!lr.ok) throw new Error('Credenciales inválidas');
      const data = await lr.json();
      setSession(data.access_token, email);
      err.className = 'form-msg ok'; err.textContent = '¡Sesión iniciada!';
      setTimeout(() => ov.classList.remove('open'), 500);
      if (typeof afterLogin === 'function') afterLogin();
    } catch (e) {
      err.className = 'form-msg err'; err.textContent = e.message || 'Error';
      btn.disabled = false; btn.textContent = isLogin ? 'Entrar' : 'Registrarme';
    }
  }

  document.addEventListener('DOMContentLoaded', renderAccount);
  return { getToken, getEmail, isLogged, openModal, logout, renderAccount };
})();
