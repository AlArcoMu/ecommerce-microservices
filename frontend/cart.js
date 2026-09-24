const eur = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });
const FALLBACK_IMG = "https://picsum.photos/seed/arco-default/600";
function esc(s){ return String(s).replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

function render() {
  const layout = document.getElementById('cart-layout');
  const items = window.CART.get();
  if (!items.length) {
    layout.innerHTML = `<div class="cart-empty">
      <p>Tu carrito está vacío.</p>
      <a class="btn-primary" href="index.html#catalogo" style="display:inline-block;width:auto;padding:14px 28px;text-decoration:none">Ir al catálogo</a>
    </div>`;
    return;
  }
  layout.innerHTML = `
    <div class="cart-items">
      ${items.map(it => `
        <div class="cart-item" data-id="${it.id}">
          <img src="${esc(it.image||FALLBACK_IMG)}" onerror="this.src='${FALLBACK_IMG}'" alt="">
          <div class="ci-info">
            <div class="ci-name">${esc(it.name)}</div>
            <div class="ci-price">${eur.format(it.price)}</div>
          </div>
          <div class="stepper">
            <button class="ci-minus">−</button><div class="val">${it.qty}</div><button class="ci-plus">+</button>
          </div>
          <div class="ci-sub">${eur.format(it.price*it.qty)}</div>
          <button class="ci-remove" aria-label="Quitar">&times;</button>
        </div>`).join('')}
    </div>

    <aside class="cart-summary">
      <h3>Resumen</h3>
      <div class="sum-line"><span>Subtotal</span><span>${eur.format(window.CART.total())}</span></div>
      <div class="sum-line"><span>Envío</span><span>${window.CART.total()>=50?'Gratis':eur.format(3.95)}</span></div>
      <div class="sum-line total"><span>Total</span><span>${eur.format(window.CART.total()+(window.CART.total()>=50?0:3.95))}</span></div>

      <form id="checkout-form" class="checkout-form" novalidate>
        <div class="field"><label>Nombre completo</label><input id="c-name" type="text" placeholder="Tu nombre"><small class="field-err" id="err-name"></small></div>
        <div class="field"><label>Correo electrónico</label><input id="c-email" type="email" placeholder="tu@correo.com"><small class="field-err" id="err-cemail"></small></div>
        <div class="field"><label>Dirección de envío</label><input id="c-addr" type="text" placeholder="Calle Mayor 12, Madrid"><small class="field-err" id="err-addr"></small></div>
        <p class="form-msg" id="c-msg"></p>
        <button type="submit" class="btn-primary" id="c-submit">Finalizar pedido</button>
      </form>
    </aside>`;

  // Cantidades y borrado
  layout.querySelectorAll('.cart-item').forEach(row => {
    const id = Number(row.dataset.id);
    const item = window.CART.get().find(x=>x.id===id);
    row.querySelector('.ci-minus').onclick = ()=>{ window.CART.setQty(id, item.qty-1); render(); };
    row.querySelector('.ci-plus').onclick  = ()=>{ window.CART.setQty(id, item.qty+1); render(); };
    row.querySelector('.ci-remove').onclick = ()=>{ window.CART.remove(id); render(); };
  });

  document.getElementById('checkout-form').addEventListener('submit', checkout);

  // Validación en vivo por campo
  const bind = (inputId, errId, fn) => {
    const el = document.getElementById(inputId);
    if (el) el.addEventListener('blur', () => { const r = fn(el.value); window.setFieldError(errId, r.ok ? '' : r.msg); });
  };
  bind('c-name', 'err-name', v => window.VALID.name(v));
  bind('c-email', 'err-cemail', v => window.VALID.email(v));
  bind('c-addr', 'err-addr', v => window.VALID.address(v));
}

async function checkout(e) {
  e.preventDefault();
  const name = document.getElementById('c-name').value.trim();
  const email = document.getElementById('c-email').value.trim();
  const addr = document.getElementById('c-addr').value.trim();
  const msg = document.getElementById('c-msg'); msg.className='form-msg'; msg.textContent='';
  ['err-name','err-cemail','err-addr'].forEach(id => window.setFieldError(id, ''));

  // Validación en cliente antes de enviar a la API
  const vn = window.VALID.name(name);
  const ve = window.VALID.email(email);
  const va = window.VALID.address(addr);
  let firstError = null;
  if (!vn.ok) { window.setFieldError('err-name', vn.msg); firstError = firstError || vn.msg; }
  if (!ve.ok) { window.setFieldError('err-cemail', ve.msg); firstError = firstError || ve.msg; }
  if (!va.ok) { window.setFieldError('err-addr', va.msg); firstError = firstError || va.msg; }
  if (firstError) { msg.classList.add('err'); msg.textContent = 'Revisa los campos marcados.'; return; }

  const btn = document.getElementById('c-submit'); btn.disabled=true; btn.textContent='Procesando…';
  const items = window.CART.get();
  const refs = [];
  for (const it of items) {
    try {
      const res = await fetch('/api/orders/orders', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ product_id: it.id, quantity: it.qty })
      });
      if (res.ok) refs.push((await res.json()).id);
    } catch {}
  }
  if (refs.length === 0) refs.push(Math.floor(1000+Math.random()*9000)); // demo

  let utm = ''; try { utm = sessionStorage.getItem('arco_utm') || ''; } catch {}
  showSuccess(name, email, refs, utm);
  window.CART.clear();
}

function showSuccess(name, email, refs, utm) {
  const overlay = document.getElementById('overlay');
  const modal = document.getElementById('modal');
  modal.innerHTML = `
    <div class="confirm">
      <div class="check">&#10003;</div>
      <h3>¡Pedido confirmado!</h3>
      <p>Gracias, ${esc(name.split(' ')[0])}.</p>
      <p class="ref">Referencia${refs.length>1?'s':''}: #${refs.join(', #')}</p>
      <p>Te enviaremos la confirmación a ${esc(email)}.</p>
      ${utm?`<p class="note">Origen de campaña registrado.</p>`:''}
      <button class="btn-primary" id="done" style="margin-top:16px">Volver al catálogo</button>
    </div>`;
  overlay.classList.add('open');
  document.getElementById('done').onclick = ()=> location.href='index.html#catalogo';
  overlay.addEventListener('click', ev => { if (ev.target===overlay) location.href='index.html#catalogo'; });
}

render();
