const API = 'https://fakestoreapi.com/products';

const elements = {
  grid: document.getElementById('grid'),
  statusBar: document.getElementById('statusBar'),
  searchInput: document.getElementById('searchInput'),
  clearSearch: document.getElementById('clearSearch'),
  categorySelect: document.getElementById('categorySelect'),
  sortSelect: document.getElementById('sortSelect'),
  priceRange: document.getElementById('priceRange'),
  priceMaxLabel: document.getElementById('priceMaxLabel'),
  resetFilters: document.getElementById('resetFilters'),
  themeToggle: document.getElementById('themeToggle'),
  noResults: document.getElementById('noResults'),
  showFavorites: document.getElementById('showFavorites'),
  status: document.getElementById('statusBar'),
  modal: document.getElementById('modal'),
  modalBackdrop: document.getElementById('modalBackdrop'),
  modalClose: document.getElementById('modalClose'),
  modalTitle: document.getElementById('modalTitle'),
  modalImage: document.getElementById('modalImage'),
  modalCategory: document.getElementById('modalCategory'),
  modalDescription: document.getElementById('modalDescription'),
  modalPrice: document.getElementById('modalPrice'),
  modalRating: document.getElementById('modalRating'),
};

let products = [];
let filtered = [];
let favorites = new Set(JSON.parse(localStorage.getItem('favorites') || '[]'));


function applyTheme(theme){
  if(theme === 'dark') document.documentElement.setAttribute('data-theme','dark');
  else document.documentElement.removeAttribute('data-theme');
  localStorage.setItem('theme', theme);
}
document.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('theme') || (window.matchMedia && window.matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light');
  applyTheme(saved);
});
elements.themeToggle.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  applyTheme(current === 'dark' ? 'light' : 'dark');
});


function money(v){ return '₹' + Number(v).toFixed(2) }


function showStatus(text){ elements.status.textContent = text; }
function clearGrid(){ elements.grid.innerHTML = ''; }

function renderProducts(list) {
  clearGrid();
  if(!list.length){
    elements.noResults.hidden = false;
    showStatus('No products to show');
    return;
  }
  elements.noResults.hidden = true;
  showStatus(`${list.length} product${list.length>1?'s':''} displayed`);
  list.forEach(p => {
    const card = document.createElement('article');
    card.className = 'card';
    card.tabIndex = 0;
    card.innerHTML = `
      <div class="thumb"><img src="${p.image}" alt="${escapeHtml(p.title)}" loading="lazy"></div>
      <div class="title" title="${escapeHtml(p.title)}">${escapeHtml(p.title)}</div>
      <div class="meta">
        <div class="price">${money(p.price)}</div>
        <div class="small muted">${escapeHtml(p.category)}</div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <button class="btn-fav" data-id="${p.id}" title="Toggle favorite">${favorites.has(p.id)?'♥':'♡'}</button>
        <button class="btn-more" data-id="${p.id}">View</button>
      </div>
    `;

    card.querySelector('.btn-more').addEventListener('click', (e) => {
      e.stopPropagation();
      openModal(p);
    });
    card.querySelector('.btn-fav').addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFavorite(p.id, e.currentTarget);
    });
    card.addEventListener('click', () => openModal(p));
    elements.grid.appendChild(card);
  });
}

function escapeHtml(text){
  return text.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
}

function openModal(product){
  elements.modal.setAttribute('aria-hidden','false');
  elements.modalTitle.textContent = product.title;
  elements.modalImage.src = product.image;
  elements.modalImage.alt = product.title;
  elements.modalCategory.textContent = product.category;
  elements.modalDescription.textContent = product.description;
  elements.modalPrice.textContent = money(product.price);
  elements.modalRating.textContent = `⭐ ${product.rating?.rate ?? 'N/A'} (${product.rating?.count ?? 0})`;
  document.body.style.overflow = 'hidden';
}
function closeModal(){
  elements.modal.setAttribute('aria-hidden','true');
  document.body.style.overflow = '';
}
elements.modalBackdrop.addEventListener('click', closeModal);
elements.modalClose.addEventListener('click', closeModal);

function toggleFavorite(id, button){
  if(favorites.has(id)){ favorites.delete(id); button.textContent = '♡'; }
  else { favorites.add(id); button.textContent = '♥'; }
  localStorage.setItem('favorites', JSON.stringify([...favorites]));
  applyFilters();
}

function applyFilters(){
  const q = elements.searchInput.value.trim().toLowerCase();
  const cat = elements.categorySelect.value;
  const maxPrice = parseFloat(elements.priceRange.value);
  const showFav = elements.showFavorites.checked;

  let list = products.slice();

  if(showFav){
    list = list.filter(p => favorites.has(p.id));
  }

  if(cat !== 'all'){
    list = list.filter(p => p.category === cat);
  }
  if(q){
    list = list.filter(p => p.title.toLowerCase().includes(q));
  }

  list = list.filter(p => p.price <= maxPrice);

  const sort = elements.sortSelect.value;
  if(sort === 'price-asc') list.sort((a,b)=>a.price-b.price);
  if(sort === 'price-desc') list.sort((a,b)=>b.price-a.price);

  filtered = list;
  renderProducts(filtered);
}

elements.searchInput.addEventListener('input', debounce(() => applyFilters(), 200));
elements.clearSearch.addEventListener('click', () => { elements.searchInput.value = ''; applyFilters(); });
elements.categorySelect.addEventListener('change', applyFilters);
elements.sortSelect.addEventListener('change', applyFilters);
elements.priceRange.addEventListener('input', () => {
  elements.priceMaxLabel.textContent = elements.priceRange.value;
  applyFilters();
});
elements.resetFilters.addEventListener('click', () => {
  elements.searchInput.value = '';
  elements.categorySelect.value = 'all';
  elements.sortSelect.value = 'default';
  elements.showFavorites.checked = false;
  if(products.length){
    elements.priceRange.max = Math.ceil(Math.max(...products.map(p => p.price)));
    elements.priceRange.value = elements.priceRange.max;
    elements.priceMaxLabel.textContent = elements.priceRange.value;
  }
  applyFilters();
});
elements.showFavorites.addEventListener('change', applyFilters);

async function init(){
  showStatus('Loading products...');
  try{
    const res = await fetch(API);
    if(!res.ok) throw new Error('Network response not ok');
    const data = await res.json();
    products = Array.isArray(data) ? data : [];
    const cats = [...new Set(products.map(p => p.category))];
    cats.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c; opt.textContent = capitalize(c);
      elements.categorySelect.appendChild(opt);
    });

    const max = Math.ceil(Math.max(...products.map(p => p.price)));
    elements.priceRange.max = max;
    elements.priceRange.value = max;
    elements.priceMaxLabel.textContent = max;


    filtered = products.slice();
    renderProducts(filtered);
    showStatus(`Loaded ${products.length} products`);
  } catch (err){
    console.error(err);
    showStatus('Failed to load products. Try again later.');
    elements.grid.innerHTML = `<div style="padding:20px" class="muted">There was an error fetching products from the API.</div>`;
  }
}
init();

function capitalize(s){ return s.charAt(0).toUpperCase() + s.slice(1) }
function debounce(fn, ms){ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), ms); } }
