// cart-store.js
// Simple shared cart logic using the browser's localStorage.
// Every page (index.html, cart.html, payment.html) includes this file.

const CART_KEY = "shopeasy_cart";

function getCart() {
  const raw = localStorage.getItem(CART_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartCount();
}

function addToCart(product) {
  const cart = getCart();
  const existing = cart.find((item) => item.id === product.id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...product, qty: 1 });
  }
  saveCart(cart);
}

function removeFromCart(productId) {
  const cart = getCart().filter((item) => item.id !== productId);
  saveCart(cart);
}

function updateQty(productId, qty) {
  if (qty < 1) return;
  const cart = getCart().map((item) =>
    item.id === productId ? { ...item, qty } : item
  );
  saveCart(cart);
}

function clearCart() {
  localStorage.removeItem(CART_KEY);
  updateCartCount();
}

function getCartTotal() {
  return getCart().reduce((sum, item) => sum + item.price * item.qty, 0);
}

function getCartCount() {
  return getCart().reduce((sum, item) => sum + item.qty, 0);
}

function updateCartCount() {
  const el = document.getElementById("cart-count");
  if (el) el.textContent = getCartCount();
}

// Update the nav cart badge as soon as the page loads
document.addEventListener("DOMContentLoaded", updateCartCount);
