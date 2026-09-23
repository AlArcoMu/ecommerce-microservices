// Catálogo: carga productos de la API y pinta las cards (con mini-carrusel)
const eur = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });
const FALLBACK_IMG = "https://picsum.photos/seed/arco-default/600";

const DEMO = [
  { id:1, name:'Auriculares inalámbricos', description:'Cancelación de ruido', price:129.99, stock:20, images:['https://picsum.photos/seed/auri1/600','https://picsum.photos/seed/auri2/600','https://picsum.photos/seed/auri3/600'] },
  { id:2, name:'Reloj inteligente', description:'GPS y monitor cardíaco', price:199.00, stock:12, images:['https://picsum.photos/seed/reloj1/600','https://picsum.photos/seed/reloj2/600'] },
  { id:3, name:'Zapatillas running', description:'Ligeras y transpirables', price:89.95, stock:35, images:['https://picsum.photos/seed/zap1/600','https://picsum.photos/seed/zap2/600','https://picsum.photos/seed/zap3/600'] },
  { id:4, name:'Mochila urbana', description:'Compartimento portátil 15"', price:54.50, stock:40, images:['https://picsum.photos/seed/mochila1/600','https://picsum.photos/seed/mochila2/600'] },
  { id:5, name:'Cámara compacta', description:'4K · estabilización óptica', price:349.00, stock:6, images:['https://picsum.photos/seed/cam1/600','https://picsum.photos/seed/cam2/600'] },
  { id:6, name:'Altavoz portátil', description:'Bluetooth · resistente al agua', price:69.90, stock:25, images:['https://picsum.photos/seed/alt1/600'] },
];

let PRODUCTS = [];
let FILTER = "";

async function load() {
  try {
    const res = await fetch('/api/products/products', { headers: { 'Accept':'application/json' } });
    if (!res.ok) throw new Error();
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) throw new Error();
    PRODUCTS = data;
  } catch (e) { PRODUCTS = DEMO; }
  render();
}

function imgsOf(p) { return (p.images && p.images.length) ? p.images : [p.image_url || FALLBACK_IMG]; }

function render() {
  const grid = document.getElementById('grid');
  const term = FILTER.trim().toLowerCase();
  const list = PRODUCTS.filter(p => !term || (p.name + ' ' + (p.description||'')).toLowerCase().includes(term));
  document.getElementById('count').textContent = `· ${list.length} producto${list.length===1?'':'s'}`;
  if (list.length === 0) {
    grid.innerHTML = `<div class="status">No hay productos que coincidan con “${escapeHtml(FILTER)}”.</div>`;
    return;
  }
  grid.innerHTML = list.map(p => {
    const imgs = imgsOf(p);
    const agotado = (p.stock ?? 0) <= 0;
    const multi = imgs.length > 1;
    return `
      <a class="card" href="producto.html?id=${p.id}">
        <div class="imgwrap" data-id="${p.id}" data-i="0">
          <img class="card-img" src="${escapeAttr(imgs[0])}" alt="${escapeAttr(p.name)}" loading="lazy" onerror="this.src='${FALLBACK_IMG}'">
          ${multi ? `
            <button class="card-nav prev" data-dir="-1" aria-label="Anterior">&lsaquo;</button>
            <button class="card-nav next" data-dir="1" aria-label="Siguiente">&rsaquo;</button>
            <div class="dots">${imgs.map((_,i)=>`<span class="dot ${i===0?'on':''}"></span>`).join('')}</div>
          ` : ''}
        </div>
        <div class="info">
          <div class="name">${escapeHtml(p.name)}</div>
          <div class="foot">
            <span class="price">${eur.format(p.price)}</span>
            <span class="stock">${agotado ? 'Agotado' : p.stock + ' uds'}</span>
          </div>
          <span class="ver-link">Ver detalle &rsaquo;</span>
        </div>
      </a>`;
  }).join('');
}

// Delegación: las flechas cambian la imagen sin navegar al detalle
document.getElementById('grid').addEventListener('click', e => {
  const btn = e.target.closest('.card-nav');
  if (!btn) return;
  e.preventDefault();
  e.stopPropagation();
  const wrap = btn.closest('.imgwrap');
  const p = PRODUCTS.find(x => x.id === Number(wrap.dataset.id));
  const imgs = imgsOf(p);
  let i = (Number(wrap.dataset.i) + Number(btn.dataset.dir) + imgs.length) % imgs.length;
  wrap.dataset.i = i;
  wrap.querySelector('.card-img').src = imgs[i];
  wrap.querySelectorAll('.dot').forEach((d, idx) => d.classList.toggle('on', idx === i));
});

document.getElementById('q').addEventListener('input', e => { FILTER = e.target.value; render(); });
document.getElementById('qbtn').addEventListener('click', () => render());

function escapeHtml(s){ return String(s).replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
function escapeAttr(s){ return escapeHtml(s); }

load();
