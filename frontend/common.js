// ============================================================
//  common.js — utilidades compartidas por todas las páginas
//  (banner cookies, volver arriba, saltar al contenido, menú
//   móvil, UTM, buscador global, carrito y toasts)
// ============================================================
(() => {
  // ---------- Estilos de componentes compartidos (inyectados) ----------
  const css = `
  .skip-link{position:absolute;left:-999px;top:0;z-index:200;background:#5433eb;color:#fff;
    padding:10px 16px;border-radius:0 0 12px 0;font-size:14px;}
  .skip-link:focus{left:0;}
  /* Barras de scroll */
  *{scrollbar-width:thin;scrollbar-color:#c7c9cc transparent;}
  *::-webkit-scrollbar{width:10px;height:10px;}
  *::-webkit-scrollbar-thumb{background:#c7c9cc;border-radius:9999px;border:2px solid #f2f4f5;}
  *::-webkit-scrollbar-thumb:hover{background:#a9abae;}
  /* Banner de cookies */
  .cookie-banner{position:fixed;left:16px;right:16px;bottom:16px;z-index:150;max-width:960px;margin:0 auto;
    background:#000;color:#fff;border-radius:20px;padding:18px 20px;display:flex;gap:16px;align-items:center;
    flex-wrap:wrap;box-shadow:rgba(0,0,0,.25) 0 8px 30px;animation:slideup .3s ease;}
  .cookie-banner p{margin:0;font-size:14px;flex:1;min-width:220px;line-height:1.5;}
  .cookie-banner a{color:#c0b5f3;}
  .cookie-actions{display:flex;gap:10px;}
  .cookie-banner button{border:none;border-radius:9999px;padding:10px 18px;font-family:inherit;font-size:13px;
    font-weight:600;cursor:pointer;}
  .ck-accept{background:#5433eb;color:#fff;}
  .ck-reject{background:#333;color:#fff;}
  @keyframes slideup{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}
  /* Volver arriba */
  .to-top{position:fixed;right:20px;bottom:20px;z-index:120;width:46px;height:46px;border:none;border-radius:9999px;
    background:#000;color:#fff;font-size:20px;cursor:pointer;box-shadow:rgba(0,0,0,.2) 0 4px 16px;
    opacity:0;pointer-events:none;transition:opacity .2s, transform .2s;}
  .to-top.show{opacity:1;pointer-events:auto;}
  .to-top:hover{transform:translateY(-3px);}
  /* Toast */
  .toast-wrap{position:fixed;left:0;right:0;bottom:80px;z-index:180;display:flex;justify-content:center;pointer-events:none;}
  .toast{background:#000;color:#fff;padding:12px 20px;border-radius:9999px;font-size:14px;
    box-shadow:rgba(0,0,0,.25) 0 6px 20px;animation:slideup .25s ease;}
  /* Menú móvil + badge carrito */
  .hamburger{display:none;margin-left:auto;background:none;border:none;font-size:26px;cursor:pointer;color:#000;line-height:1;}
  .cart-link{position:relative;}
  .cart-badge{display:inline-flex;align-items:center;justify-content:center;min-width:18px;height:18px;
    padding:0 5px;border-radius:9999px;background:#5433eb;color:#fff;font-size:11px;font-weight:600;margin-left:4px;}
  @media(max-width:720px){
    .hamburger{display:block;}
    .top-links{position:absolute;top:100%;right:16px;left:16px;flex-direction:column;gap:14px !important;
      background:#fff;border-radius:20px;padding:18px;box-shadow:rgba(0,0,0,.12) 0 8px 30px;display:none !important;}
    .top-links.open{display:flex !important;}
  }`;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  // ---------- Skip link + id en el main ----------
  const main = document.querySelector('main');
  if (main && !main.id) main.id = 'main';
  const skip = document.createElement('a');
  skip.className = 'skip-link';
  skip.href = '#' + (main ? main.id : 'top');
  skip.textContent = 'Saltar al contenido';
  document.body.insertBefore(skip, document.body.firstChild);

  // ---------- Banner de cookies ----------
  const CK = 'arco_cookies';
  if (!localStorage.getItem(CK)) {
    const b = document.createElement('div');
    b.className = 'cookie-banner';
    b.innerHTML = `<p>Usamos cookies técnicas para el funcionamiento del sitio. Consulta la
      <a href="cookies.html">política de cookies</a>.</p>
      <div class="cookie-actions">
        <button class="ck-reject" id="ck-reject">Rechazar</button>
        <button class="ck-accept" id="ck-accept">Aceptar</button>
      </div>`;
    document.body.appendChild(b);
    const close = v => { try { localStorage.setItem(CK, v); } catch {} b.remove(); };
    b.querySelector('#ck-accept').onclick = () => close('accepted');
    b.querySelector('#ck-reject').onclick = () => close('rejected');
  }

  // ---------- Volver arriba ----------
  const top = document.createElement('button');
  top.className = 'to-top'; top.setAttribute('aria-label', 'Volver arriba'); top.innerHTML = '&uarr;';
  document.body.appendChild(top);
  top.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  window.addEventListener('scroll', () => top.classList.toggle('show', window.scrollY > 400));

  // ---------- Parámetros UTM ----------
  const usp = new URLSearchParams(location.search);
  const utm = {};
  ['utm_source','utm_medium','utm_campaign','utm_term','utm_content'].forEach(k => { if (usp.get(k)) utm[k] = usp.get(k); });
  if (Object.keys(utm).length) { try { sessionStorage.setItem('arco_utm', JSON.stringify(utm)); } catch {} }

  // ---------- Menú móvil ----------
  const ham = document.getElementById('hamburger');
  const nav = document.getElementById('nav');
  if (ham && nav) ham.onclick = () => nav.classList.toggle('open');

  // ---------- Buscador global (desde páginas sin catálogo) ----------
  const q = document.getElementById('q');
  if (q && !document.getElementById('grid')) {
    const go = () => { location.href = 'index.html?search=' + encodeURIComponent(q.value.trim()) + '#catalogo'; };
    q.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
    const qb = document.getElementById('qbtn'); if (qb) qb.onclick = go;
  }

  // ---------- Carrito (localStorage) ----------
  const CART = 'arco_cart';
  const read = () => { try { return JSON.parse(localStorage.getItem(CART)) || []; } catch { return []; } };
  const write = c => { try { localStorage.setItem(CART, JSON.stringify(c)); } catch {} badges(); };
  const count = () => read().reduce((a, x) => a + x.qty, 0);
  const total = () => read().reduce((a, x) => a + x.price * x.qty, 0);
  function badges() {
    document.querySelectorAll('.cart-badge').forEach(b => {
      const n = count(); b.textContent = n; b.style.display = n > 0 ? 'inline-flex' : 'none';
    });
  }
  window.CART = {
    get: read,
    add(item) { const c = read(); const e = c.find(x => x.id === item.id); if (e) e.qty += item.qty; else c.push(item); write(c); },
    setQty(id, qty) { let c = read(); const e = c.find(x => x.id === id); if (e) { e.qty = qty; if (e.qty <= 0) c = c.filter(x => x.id !== id); } write(c); },
    remove(id) { write(read().filter(x => x.id !== id)); },
    clear() { write([]); },
    count, total
  };
  badges();

  // ---------- Toast ----------
  window.toast = (msg) => {
    let wrap = document.querySelector('.toast-wrap');
    if (!wrap) { wrap = document.createElement('div'); wrap.className = 'toast-wrap'; document.body.appendChild(wrap); }
    const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg;
    wrap.appendChild(t);
    setTimeout(() => t.remove(), 2200);
  };
})();

// ============================================================
//  VALID — validaciones de formulario (cliente)
// ============================================================
window.VALID = {
  email(v) {
    v = (v || '').trim();
    if (!v) return { ok: false, msg: 'Introduce tu correo.' };
    if (!v.includes('@')) return { ok: false, msg: 'Falta la @ en el correo.' };
    // local@dominio.tld  (tld de 2+ letras: .com, .es, .org…)
    const re = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
    if (!re.test(v)) return { ok: false, msg: 'Correo no válido (ej.: nombre@dominio.com).' };
    if (/\.\./.test(v)) return { ok: false, msg: 'El correo tiene puntos consecutivos.' };
    return { ok: true };
  },
  password(v, { strong = false } = {}) {
    v = v || '';
    if (v.length < 8) return { ok: false, msg: 'Mínimo 8 caracteres.' };
    if (/\s/.test(v)) return { ok: false, msg: 'La contraseña no puede tener espacios.' };
    if (strong) {
      if (!/[A-Z]/.test(v)) return { ok: false, msg: 'Debe incluir al menos una mayúscula.' };
      if (!/[a-z]/.test(v)) return { ok: false, msg: 'Debe incluir al menos una minúscula.' };
      if (!/[0-9]/.test(v)) return { ok: false, msg: 'Debe incluir al menos un número.' };
    }
    return { ok: true };
  },
  name(v) {
    v = (v || '').trim();
    if (v.length < 3) return { ok: false, msg: 'Introduce tu nombre completo.' };
    if (!/[a-zA-ZÀ-ÿ]/.test(v)) return { ok: false, msg: 'El nombre debe contener letras.' };
    return { ok: true };
  },
  address(v) {
    v = (v || '').trim();
    if (v.length < 5) return { ok: false, msg: 'La dirección es demasiado corta.' };
    if (!/[a-zA-ZÀ-ÿ]/.test(v)) return { ok: false, msg: 'Incluye el nombre de la calle.' };
    if (!/\d/.test(v)) return { ok: false, msg: 'Incluye el número (ej.: Calle Mayor 12).' };
    return { ok: true };
  }
};

// Utilidad para pintar el error bajo un campo
window.setFieldError = (id, msg) => {
  const el = document.getElementById(id);
  if (el) el.textContent = msg || '';
};

// ============================================================
//  Buscador colapsable en móvil (lupa que despliega el buscador)
// ============================================================
(() => {
  const extra = document.createElement('style');
  extra.textContent = `
    .search-toggle{display:none;align-items:center;justify-content:center;width:42px;height:42px;border:none;
      border-radius:9999px;background:#fff;color:#000;cursor:pointer;box-shadow:rgba(0,0,0,.06) 0 2px 8px;margin-left:auto;}
    .search-toggle:hover{background:#f2f4f5;}
    @media(max-width:720px){
      .search-toggle{display:flex;}
      .hamburger{margin-left:8px;}
      header.top .search{position:absolute;top:100%;left:16px;right:16px;display:none;margin-top:8px;
        box-shadow:rgba(0,0,0,.12) 0 8px 30px;z-index:60;}
      header.top.search-open .search{display:flex;}
    }`;
  document.head.appendChild(extra);

  const hdr = document.querySelector('header.top');
  const wrap = hdr && hdr.querySelector('.wrap');
  const search = wrap && wrap.querySelector('.search');
  if (!hdr || !wrap || !search) return;

  const btn = document.createElement('button');
  btn.className = 'search-toggle';
  btn.setAttribute('aria-label', 'Buscar');
  btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>';

  const ham = wrap.querySelector('.hamburger');
  wrap.insertBefore(btn, ham || null);

  btn.addEventListener('click', () => {
    hdr.classList.toggle('search-open');
    hdr.classList.remove('nav-open'); // no solapar con el menú
    const nav = document.getElementById('nav'); if (nav) nav.classList.remove('open');
    if (hdr.classList.contains('search-open')) {
      const i = search.querySelector('input'); if (i) setTimeout(() => i.focus(), 50);
    }
  });
})();
