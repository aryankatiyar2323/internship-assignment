const grid = document.getElementById("grid");
const search = document.getElementById("search");
const sort = document.getElementById("sort");
const themeToggle = document.getElementById("themeToggle");

let products = [];
let filtered = [];

// Load products from API
async function loadProducts() {
  try {
    const res = await fetch("https://fakestoreapi.com/products");
    products = await res.json();
  } catch (e) {
    console.log("API down, loading fallback…");
    const res = await fetch("data.json");
    products = await res.json();
  }

  filtered = [...products];
  render();
}

// Render product cards
function render() {
  grid.innerHTML = "";

  filtered.forEach(p => {
    grid.innerHTML += `
      <div class="card">
        <img src="${p.image}">
        <div class="title">${p.title}</div>
        <div class="price">$${p.price}</div>
      </div>
    `;
  });
}

// Search functionality
search.addEventListener("input", e => {
  const q = e.target.value.toLowerCase();
  filtered = products.filter(p => p.title.toLowerCase().includes(q));
  render();
});

// Sorting
sort.addEventListener("change", () => {
  if (sort.value === "low") filtered.sort((a,b) => a.price - b.price);
  else if (sort.value === "high") filtered.sort((a,b) => b.price - a.price);
  else filtered = [...products];
  render();
});

// Theme toggle
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  themeToggle.textContent = 
    document.body.classList.contains("dark") 
    ? "☀ Light Mode" 
    : "🌙 Dark Mode";
});

loadProducts();
