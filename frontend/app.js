// Catálogo: carga, skeleton, filtro por categoría, orden, buscador y carrito
const eur = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });
const FALLBACK_IMG = "https://picsum.photos/seed/arco-default/600";

const CAT_LABELS = { electronica:'Electrónica', audiovisuales:'Audiovisuales', moda:'Moda',
  hogar:'Hogar', deporte:'Deporte', otros:'Otros' };

const DEMO = [
  { id:1, name:'Auriculares inalámbricos', description:'Cancelación de ruido', price:129.99, stock:20, category:'audiovisuales', images:['https://picsum.photos/seed/auri1/600','https://picsum.photos/seed/auri2/600','https://picsum.photos/seed/auri3/600'] },
  { id:2, name:'Reloj inteligente', description:'GPS y monitor cardíaco', price:199.00, stock:12, category:'electronica', images:['https://picsum.photos/seed/reloj1/600','https://picsum.photos/seed/reloj2/600'] },
  { id:3, name:'Zapatillas running', description:'Ligeras y transpirables', price:89.95, stock:35, category:'deporte', images:['https://picsum.photos/seed/zap1/600','https://picsum.photos/seed/zap2/600'] },
  { id:4, name:'Cámara compacta', description:'4K · estabilización óptica', price:349.00, stock:6, category:'audiovisuales', images:['https://picsum.photos/seed/cam1/600','https://picsum.photos/seed/cam2/600'] },
  { id:5, name:'Tablet Pro 11', description:'Pantalla 120Hz · 256GB', price:449.00, stock:15, category:'electronica', images:['https://picsum.photos/seed/tab1/600','https://picsum.photos/seed/tab2/600'] },
  { id:6, name:'Altavoz portátil', description:'Bluetooth · resistente al agua', price:69.90, stock:25, category:'audiovisuales', images:['https://picsum.photos/seed/alt1/600'] },
];

let PRODUCTS = [];
let FILTER = "";
let CAT = "all";
let SORT = "rel";

// Buscador desde otras páginas: ?search=
const sp = new URLSearchParams(location.search);
if (sp.get('search')) FILTER = sp.get('search');

function imgsOf(p){ return (p.images && p.images.length) ? p.images : [p.image_url || FALLBACK_IMG]; }
function catLabel(c){ return CAT_LABELS[c] || (c ? c.charAt(0).toUpperCase()+c.slice(1) : 'Otros'); }

function skeleton() {
  const grid = document.getElementById('grid');
  grid.innerHTML = Array.from({length:8}).map(()=>`
    <div class="card skeleton">
      <div class="imgwrap sk"></div>
      <div class="info"><div class="sk-line"></div><div class="sk-line short"></div></div>
    </div>`).join('');
}

async function load() {
  skeleton();
  const q = document.getElementById('q');
  if (q && FILTER) q.value = FILTER;
  try {
    const res = await fetch('/api/products/products', { headers: { 'Accept':'application/json' } });
    if (!res.ok) throw new Error();
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) throw new Error();
    PRODUCTS = data;
  } catch (e) { PRODUCTS = DEMO; }
  renderChips();
  render();
}

function renderChips() {
  const cats = [...new Set(PRODUCTS.map(p => p.category || 'otros'))];
  const chips = document.getElementById('chips');
  chips.innerHTML = [['all','Todos'], ...cats.map(c=>[c, catLabel(c)])]
    .map(([v,l]) => `<button class="chip ${v===CAT?'on':''}" data-cat="${v}">${l}</button>`).join('');
  chips.querySelectorAll('.chip').forEach(c => c.onclick = () => { CAT = c.dataset.cat; renderChips(); render(); });
}

function render() {
  const grid = document.getElementById('grid');
  const term = FILTER.trim().toLowerCase();
  let list = PRODUCTS.filter(p => {
    const okCat = CAT === 'all' || (p.category || 'otros') === CAT;
    const okTerm = !term || (p.name + ' ' + (p.description||'')).toLowerCase().includes(term);
    return okCat && okTerm;
  });

  if (SORT === 'price-asc') list.sort((a,b)=>a.price-b.price);
  else if (SORT === 'price-desc') list.sort((a,b)=>b.price-a.price);
  else if (SORT === 'name') list.sort((a,b)=>a.name.localeCompare(b.name));

  document.getElementById('count').textContent = `· ${list.length} producto${list.length===1?'':'s'}`;

  if (list.length === 0) {
    grid.innerHTML = `<div class="status">No hay productos que coincidan con tu búsqueda.</div>`;
    return;
  }
  grid.innerHTML = list.map(p => {
    const imgs = imgsOf(p);
    const agotado = (p.stock ?? 0) <= 0;
    const multi = imgs.length > 1;
    return `
      <div class="card">
        <a class="card-media" href="producto.html?id=${p.id}">
          <div class="imgwrap" data-id="${p.id}" data-i="0">
            <img class="card-img" src="${escapeAttr(imgs[0])}" alt="${escapeAttr(p.name)}" loading="lazy" onerror="this.src='${FALLBACK_IMG}'">
            ${multi ? `
              <button class="card-nav prev" data-dir="-1" aria-label="Anterior">&lsaquo;</button>
              <button class="card-nav next" data-dir="1" aria-label="Siguiente">&rsaquo;</button>
              <div class="dots">${imgs.map((_,i)=>`<span class="dot ${i===0?'on':''}"></span>`).join('')}</div>` : ''}
          </div>
        </a>
        <div class="info">
          <span class="cat-tag">${catLabel(p.category)}</span>
          <a class="name" href="producto.html?id=${p.id}">${escapeHtml(p.name)}</a>
          <div class="foot">
            <span class="price">${eur.format(p.price)}</span>
            <span class="stock">${agotado ? 'Agotado' : p.stock + ' uds'}</span>
          </div>
          <button class="btn-add" data-id="${p.id}" ${agotado?'disabled':''}>${agotado?'Agotado':'Añadir al carrito'}</button>
        </div>
      </div>`;
  }).join('');
}

// Delegación de clics en el grid: carrusel + añadir al carrito
document.getElementById('grid').addEventListener('click', e => {
  const nav = e.target.closest('.card-nav');
  if (nav) {
    e.preventDefault();
    const wrap = nav.closest('.imgwrap');
    const p = PRODUCTS.find(x => x.id === Number(wrap.dataset.id));
    const imgs = imgsOf(p);
    let i = (Number(wrap.dataset.i) + Number(nav.dataset.dir) + imgs.length) % imgs.length;
    wrap.dataset.i = i;
    wrap.querySelector('.card-img').src = imgs[i];
    wrap.querySelectorAll('.dot').forEach((d, idx) => d.classList.toggle('on', idx === i));
    return;
  }
  const add = e.target.closest('.btn-add');
  if (add && !add.disabled) {
    const p = PRODUCTS.find(x => x.id === Number(add.dataset.id));
    window.CART.add({ id:p.id, name:p.name, price:p.price, image:imgsOf(p)[0], qty:1 });
    window.toast('Añadido al carrito');
  }
});

document.getElementById('q').addEventListener('input', e => { FILTER = e.target.value; render(); });
document.getElementById('qbtn').addEventListener('click', () => render());
document.getElementById('sort').addEventListener('change', e => { SORT = e.target.value; render(); });

function escapeHtml(s){ return String(s).replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
function escapeAttr(s){ return escapeHtml(s); }

load();
