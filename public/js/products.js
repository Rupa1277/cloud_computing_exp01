// products.js - loads products from the backend and renders the grid

async function loadProducts() {
  const grid = document.getElementById("product-grid");
  grid.innerHTML = "<p>Loading products...</p>";

  try {
    const res = await fetch("/api/products");
    if (!res.ok) throw new Error("Request failed");
    const products = await res.json();

    if (products.length === 0) {
      grid.innerHTML = "<p>No products found.</p>";
      return;
    }

    grid.innerHTML = products
      .map(
        (p) => `
        <div class="product-card">
          <img src="${p.image}" alt="${p.name}">
          <h3>${p.name}</h3>
          <p class="desc">${p.description}</p>
          <p class="price">₹${p.price}</p>
          <button onclick='addToCart(${JSON.stringify({
            id: p.id,
            name: p.name,
            price: p.price,
            image: p.image,
          })})'>Add to Cart</button>
        </div>
      `
      )
      .join("");
  } catch (err) {
    console.error(err);
    grid.innerHTML =
      '<p class="error">Could not load products. Is the server running? (npm start)</p>';
  }
}

document.addEventListener("DOMContentLoaded", loadProducts);
