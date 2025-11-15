const API = 'https://fakestoreapi.com/products';
let products = [];
async function init() {
  try {
    const r = await fetch(API);
    products = await r.json();
  } catch {
    products = await fetch('data.json').then(r=>r.json());
  }
  render();
}
function render() {
  const grid = document.getElementById('gridWrap');
  grid.innerHTML = '';
  products.forEach(p=>{
    const tmpl = document.getElementById('cardTemplate').content.cloneNode(true);
    tmpl.querySelector('.card-img').src = p.image || 'https://via.placeholder.com/300';
    tmpl.querySelector('.card-title').textContent = p.title;
    tmpl.querySelector('.card-price').textContent = '$' + Number(p.price).toFixed(2);
    grid.appendChild(tmpl);
  });
}
window.addEventListener('load', init);
