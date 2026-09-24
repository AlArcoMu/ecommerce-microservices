const eur = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });
const FALLBACK_IMG = "https://picsum.photos/seed/arco-default/600";

const PID = Number(new URLSearchParams(location.search).get('id'));
let product = null, images = [], current = 0, qty = 1;

function esc(s){ return String(s).replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
function stars(n){ return '★'.repeat(Math.round(n)) + '☆'.repeat(5-Math.round(n)); }

async function init() {
  const body = document.getElementById('detail-body');
  body.innerHTML = `<div class="detail-grid"><div class="main-img sk" style="aspect-ratio:1/1;border-radius:28px"></div>
    <div><div class="sk-line" style="width:60%"></div><div class="sk-line short"></div><div class="sk-line"></div></div></div>`;
  if (!PID) { body.innerHTML = '<div class="status">Producto no encontrado.</div>'; return; }
  try {
    const res = await fetch(`/api/products/products/${PID}`);
    if (!res.ok) throw new Error();
    product = await res.json();
  } catch (e) { body.innerHTML = '<div class="status">No se pudo cargar el producto.</div>'; return; }
  images = (product.images && product.images.length) ? product.images : [FALLBACK_IMG];
  // SEO dinámico de la ficha
  document.title = product.name + ' · alarcomushop';
  const md = document.querySelector('meta[name="description"]');
  if (md) md.setAttribute('content', (product.description || product.name).slice(0, 155));
  renderDetail();
  loadReviews();
}

function renderDetail() {
  const agotado = (product.stock ?? 0) <= 0;
  document.getElementById('detail-body').innerHTML = `
    <div class="detail-grid">
      <div class="gallery">
        <div class="main-img">
          <img id="mainImg" src="${esc(images[0])}" alt="${esc(product.name)}" onerror="this.src='${FALLBACK_IMG}'">
          ${images.length>1 ? `<button class="nav prev" id="prev">&lsaquo;</button><button class="nav next" id="next">&rsaquo;</button>`:''}
        </div>
        ${images.length>1 ? `<div class="thumbs">${images.map((im,i)=>`<img class="thumb ${i===0?'active':''}" data-i="${i}" src="${esc(im)}" onerror="this.src='${FALLBACK_IMG}'">`).join('')}</div>`:''}
      </div>
      <div class="detail-info">
        ${product.category?`<span class="cat-tag">${esc(product.category)}</span>`:''}
        <h1>${esc(product.name)}</h1>
        <div class="rating-summary" id="rating-summary"></div>
        <div class="detail-price">${eur.format(product.price)}</div>
        <div class="detail-stock">${agotado?'Agotado':product.stock+' unidades disponibles'}</div>
        <p class="detail-desc">${esc(product.description||'Sin descripción.')}</p>
        <div class="qty-row">
          <div class="stepper"><button id="minus">−</button><div class="val" id="val">1</div><button id="plus">+</button></div>
          <button class="btn-primary" id="addBtn" ${agotado?'disabled':''}>${agotado?'No disponible':'Añadir al carrito'}</button>
        </div>
        <button class="btn-ghost" id="copyBtn">🔗 Copiar enlace</button>
      </div>
    </div>
    <section class="reviews">
      <h2>Valoraciones</h2>
      <div id="review-form"></div>
      <div id="review-list"><div class="status">Cargando valoraciones…</div></div>
    </section>`;

  if (images.length>1) {
    document.getElementById('prev').onclick = ()=>show(current-1);
    document.getElementById('next').onclick = ()=>show(current+1);
    document.querySelectorAll('.thumb').forEach(t=>t.onclick=()=>show(Number(t.dataset.i)));
  }
  document.getElementById('minus').onclick = ()=>{ if(qty>1){qty--; document.getElementById('val').textContent=qty;} };
  document.getElementById('plus').onclick  = ()=>{ if(qty<product.stock){qty++; document.getElementById('val').textContent=qty;} };
  document.getElementById('addBtn').onclick = ()=>{
    window.CART.add({ id:product.id, name:product.name, price:product.price, image:images[0], qty });
    window.toast(`Añadido (${qty})`);
  };
  document.getElementById('copyBtn').onclick = copyLink;
  renderReviewForm();
}

function show(i){ current=(i+images.length)%images.length; document.getElementById('mainImg').src=images[current];
  document.querySelectorAll('.thumb').forEach((t,idx)=>t.classList.toggle('active',idx===current)); }

async function copyLink() {
  const btn = document.getElementById('copyBtn');
  try { await navigator.clipboard.writeText(location.href); }
  catch { const t=document.createElement('textarea'); t.value=location.href; document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove(); }
  const prev = btn.textContent; btn.textContent = '✓ ¡Enlace copiado!';
  setTimeout(()=>btn.textContent = prev, 1800);
}

// -------- Reseñas --------
async function loadReviews() {
  const list = document.getElementById('review-list');
  let reviews = [];
  try { const r = await fetch(`/api/products/products/${PID}/reviews`); if (r.ok) reviews = await r.json(); } catch {}
  const s = document.getElementById('rating-summary');
  if (reviews.length) {
    const avg = reviews.reduce((a,r)=>a+r.rating,0)/reviews.length;
    s.innerHTML = `<span class="stars">${stars(avg)}</span> <span class="avg">${avg.toFixed(1)}</span> <span class="cnt">(${reviews.length})</span>`;
  } else { s.innerHTML = `<span class="cnt">Sin valoraciones todavía</span>`; }
  list.innerHTML = reviews.length ? reviews.map(r=>`
    <div class="review"><div class="review-head"><span class="stars">${stars(r.rating)}</span>
      <span class="review-user">${esc(r.user_email)}</span></div>
      ${r.comment?`<p class="review-comment">${esc(r.comment)}</p>`:''}</div>`).join('')
    : `<p class="status">Sé el primero en valorar este producto.</p>`;
}

function renderReviewForm() {
  const box = document.getElementById('review-form');
  if (!AUTH.isLogged()) {
    box.innerHTML = `<div class="login-gate">Inicia sesión para dejar tu valoración. <a class="acc-link" id="gate-login">Iniciar sesión</a></div>`;
    box.querySelector('#gate-login').onclick = ()=>AUTH.openModal(renderReviewForm);
    return;
  }
  box.innerHTML = `<div class="review-form">
      <div class="star-pick" id="star-pick">${[1,2,3,4,5].map(n=>`<span class="pick" data-n="${n}">☆</span>`).join('')}</div>
      <textarea id="rv-comment" placeholder="Cuenta tu experiencia (opcional)"></textarea>
      <button class="btn-primary" id="rv-submit">Publicar valoración</button>
      <p class="form-msg" id="rv-msg"></p></div>`;
  let picked = 0;
  const picks = box.querySelectorAll('.pick');
  picks.forEach(p=>{ p.onmouseover=()=>picks.forEach((x,i)=>x.textContent=i<p.dataset.n?'★':'☆');
    p.onclick=()=>{ picked=Number(p.dataset.n); picks.forEach((x,i)=>x.textContent=i<picked?'★':'☆'); }; });
  box.querySelector('#star-pick').onmouseleave=()=>picks.forEach((x,i)=>x.textContent=i<picked?'★':'☆');
  box.querySelector('#rv-submit').onclick=()=>submitReview(picked);
}

async function submitReview(rating) {
  const msg = document.getElementById('rv-msg'); msg.className='form-msg'; msg.textContent='';
  if (rating<1){ msg.classList.add('err'); msg.textContent='Elige una puntuación (1-5).'; return; }
  const comment = document.getElementById('rv-comment').value;
  const btn = document.getElementById('rv-submit'); btn.disabled=true; btn.textContent='Publicando…';
  try {
    const res = await fetch(`/api/products/products/${PID}/reviews`, {
      method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${AUTH.getToken()}`},
      body: JSON.stringify({ rating, comment })
    });
    if (res.status===401){ AUTH.logout(); throw new Error('Sesión caducada, vuelve a entrar.'); }
    if (!res.ok) throw new Error('No se pudo publicar.');
    renderReviewForm(); loadReviews(); window.toast('¡Gracias por tu valoración!');
  } catch(e){ msg.classList.add('err'); msg.textContent=e.message; btn.disabled=false; btn.textContent='Publicar valoración'; }
}

init();
