const eur = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });
const FALLBACK_IMG = "https://picsum.photos/seed/arco-default/600/600";

const params = new URLSearchParams(location.search);
const PID = Number(params.get('id'));

let product = null;
let images = [];
let current = 0;
let qty = 1;

function esc(s){ return String(s).replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
function stars(n){ const full='★'.repeat(Math.round(n)); const empty='☆'.repeat(5-Math.round(n)); return full+empty; }

async function init() {
  const body = document.getElementById('detail-body');
  if (!PID) { body.innerHTML = '<div class="status">Producto no encontrado.</div>'; return; }
  try {
    const res = await fetch(`/api/products/products/${PID}`);
    if (!res.ok) throw new Error();
    product = await res.json();
  } catch (e) {
    body.innerHTML = '<div class="status">No se pudo cargar el producto. ¿Está la API conectada?</div>';
    return;
  }
  images = (product.images && product.images.length ? product.images : [FALLBACK_IMG]);
  renderDetail();
  loadReviews();
}

function renderDetail() {
  const body = document.getElementById('detail-body');
  const agotado = (product.stock ?? 0) <= 0;
  body.innerHTML = `
    <div class="detail-grid">
      <div class="gallery">
        <div class="main-img">
          <img id="mainImg" src="${esc(images[0])}" alt="${esc(product.name)}" onerror="this.src='${FALLBACK_IMG}'">
          ${images.length > 1 ? `
            <button class="nav prev" id="prev" aria-label="Anterior">&lsaquo;</button>
            <button class="nav next" id="next" aria-label="Siguiente">&rsaquo;</button>` : ''}
        </div>
        ${images.length > 1 ? `<div class="thumbs" id="thumbs">
          ${images.map((im,i)=>`<img class="thumb ${i===0?'active':''}" data-i="${i}" src="${esc(im)}" onerror="this.src='${FALLBACK_IMG}'">`).join('')}
        </div>` : ''}
      </div>

      <div class="detail-info">
        <h1>${esc(product.name)}</h1>
        <div class="rating-summary" id="rating-summary"></div>
        <div class="detail-price">${eur.format(product.price)}</div>
        <div class="detail-stock">${agotado ? 'Agotado' : product.stock + ' unidades disponibles'}</div>
        <p class="detail-desc">${esc(product.description || 'Sin descripción.')}</p>
        <button class="btn-primary" id="buyBtn" ${agotado?'disabled':''}>${agotado?'No disponible':'Comprar'}</button>
      </div>
    </div>

    <section class="reviews">
      <h2>Valoraciones</h2>
      <div id="review-form"></div>
      <div id="review-list"><div class="status">Cargando valoraciones…</div></div>
    </section>`;

  // Carrusel
  if (images.length > 1) {
    document.getElementById('prev').onclick = () => show(current - 1);
    document.getElementById('next').onclick = () => show(current + 1);
    document.querySelectorAll('.thumb').forEach(t => t.onclick = () => show(Number(t.dataset.i)));
  }
  document.getElementById('buyBtn').onclick = openBuy;
  renderReviewForm();
}

function show(i) {
  current = (i + images.length) % images.length;
  document.getElementById('mainImg').src = images[current];
  document.querySelectorAll('.thumb').forEach((t,idx)=>t.classList.toggle('active', idx===current));
}

// ---------- Reseñas ----------
async function loadReviews() {
  const list = document.getElementById('review-list');
  let reviews = [];
  try {
    const res = await fetch(`/api/products/products/${PID}/reviews`);
    if (res.ok) reviews = await res.json();
  } catch (e) {}

  const summary = document.getElementById('rating-summary');
  if (reviews.length) {
    const avg = reviews.reduce((a,r)=>a+r.rating,0) / reviews.length;
    summary.innerHTML = `<span class="stars">${stars(avg)}</span> <span class="avg">${avg.toFixed(1)}</span> <span class="cnt">(${reviews.length})</span>`;
  } else {
    summary.innerHTML = `<span class="cnt">Sin valoraciones todavía</span>`;
  }

  if (!reviews.length) {
    list.innerHTML = `<p class="status">Sé el primero en valorar este producto.</p>`;
    return;
  }
  list.innerHTML = reviews.map(r => `
    <div class="review">
      <div class="review-head">
        <span class="stars">${stars(r.rating)}</span>
        <span class="review-user">${esc(r.user_email)}</span>
      </div>
      ${r.comment ? `<p class="review-comment">${esc(r.comment)}</p>` : ''}
    </div>`).join('');
}

function renderReviewForm() {
  const box = document.getElementById('review-form');
  if (!AUTH.isLogged()) {
    box.innerHTML = `<div class="login-gate">Inicia sesión para dejar tu valoración. <a class="acc-link" id="gate-login">Iniciar sesión</a></div>`;
    box.querySelector('#gate-login').onclick = () => AUTH.openModal(renderReviewForm);
    return;
  }
  box.innerHTML = `
    <div class="review-form">
      <div class="star-pick" id="star-pick">${[1,2,3,4,5].map(n=>`<span class="pick" data-n="${n}">☆</span>`).join('')}</div>
      <textarea id="rv-comment" placeholder="Cuenta tu experiencia (opcional)"></textarea>
      <button class="btn-primary" id="rv-submit">Publicar valoración</button>
      <p class="auth-error" id="rv-error"></p>
    </div>`;
  let picked = 0;
  const picks = box.querySelectorAll('.pick');
  picks.forEach(p => {
    p.onmouseover = () => picks.forEach((x,i)=>x.textContent = i < p.dataset.n ? '★' : '☆');
    p.onclick = () => { picked = Number(p.dataset.n); picks.forEach((x,i)=>x.textContent = i < picked ? '★':'☆'); };
  });
  box.querySelector('#star-pick').onmouseleave = () => picks.forEach((x,i)=>x.textContent = i < picked ? '★':'☆');
  box.querySelector('#rv-submit').onclick = () => submitReview(picked);
}

async function submitReview(rating) {
  const err = document.getElementById('rv-error');
  err.textContent = '';
  if (rating < 1) { err.textContent = 'Elige una puntuación (1 a 5 estrellas).'; return; }
  const comment = document.getElementById('rv-comment').value;
  const btn = document.getElementById('rv-submit');
  btn.disabled = true; btn.textContent = 'Publicando…';
  try {
    const res = await fetch(`/api/products/products/${PID}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${AUTH.getToken()}` },
      body: JSON.stringify({ rating, comment })
    });
    if (res.status === 401) { AUTH.logout(); throw new Error('Sesión caducada, vuelve a iniciar sesión.'); }
    if (!res.ok) throw new Error('No se pudo publicar la valoración.');
    renderReviewForm();
    loadReviews();
  } catch (e) {
    err.textContent = e.message; btn.disabled = false; btn.textContent = 'Publicar valoración';
  }
}

// ---------- Compra ----------
const overlay = document.getElementById('overlay');
const modal = document.getElementById('modal');

function openBuy() {
  qty = 1;
  modal.innerHTML = `
    <span class="close" id="close">&times;</span>
    <div class="mhead">
      <img src="${esc(images[0])}" alt="" onerror="this.src='${FALLBACK_IMG}'">
      <div><div class="n">${esc(product.name)}</div><div class="p">${eur.format(product.price)} · ${product.stock} uds</div></div>
    </div>
    <div class="qty"><span>Cantidad</span>
      <div class="stepper"><button id="minus">−</button><div class="val" id="val">1</div><button id="plus">+</button></div>
    </div>
    <div class="total-line"><span class="lbl">Total</span><span class="amt" id="total">${eur.format(product.price)}</span></div>
    <button class="btn-primary" id="buy">Realizar pedido</button>
    <p class="note">Sin pago online. Simula la creación de un pedido en tu API.</p>`;
  overlay.classList.add('open');
  document.getElementById('close').onclick = () => overlay.classList.remove('open');
  document.getElementById('minus').onclick = () => { if(qty>1){qty--; updTotal();} };
  document.getElementById('plus').onclick  = () => { if(qty<product.stock){qty++; updTotal();} };
  document.getElementById('buy').onclick   = doOrder;
}
function updTotal(){ document.getElementById('val').textContent = qty; document.getElementById('total').textContent = eur.format(product.price*qty); }
overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.remove('open'); });

async function doOrder() {
  const btn = document.getElementById('buy');
  btn.disabled = true; btn.textContent = 'Procesando…';
  let ref=null, demo=false;
  try {
    const res = await fetch('/api/orders/orders', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ product_id: product.id, quantity: qty })
    });
    if (!res.ok) throw new Error();
    ref = (await res.json()).id;
  } catch(e){ demo=true; ref = Math.floor(1000+Math.random()*9000); }
  modal.innerHTML = `
    <div class="confirm">
      <div class="check">&#10003;</div>
      <h3>¡Pedido confirmado!</h3>
      <p>${esc(product.name)} · ${qty} ud${qty>1?'s':''}</p>
      <p class="ref">Referencia #${ref}</p>
      <p>Total: ${eur.format(product.price*qty)}</p>
      <button class="btn-primary" id="done" style="margin-top:16px">Seguir comprando</button>
      ${demo?'<p class="note">Referencia de demostración (API no conectada).</p>':''}
    </div>`;
  document.getElementById('done').onclick = () => location.href = 'index.html#catalogo';
}

init();
