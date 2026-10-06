// cart.js - renders the cart page

function renderCart() {
  const container = document.getElementById("cart-container");
  const cart = getCart();

  if (cart.length === 0) {
    container.innerHTML = "<p>Your cart is empty. Go add some products!</p>";
    return;
  }

  const rows = cart
    .map(
      (item) => `
      <tr>
        <td class="cart-product">
          <img src="${item.image}" alt="${item.name}">
          <span>${item.name}</span>
        </td>
        <td>₹${item.price}</td>
        <td>
          <input type="number" min="1" value="${item.qty}"
            onchange="updateQty(${item.id}, parseInt(this.value) || 1); renderCart();">
        </td>
        <td>₹${item.price * item.qty}</td>
        <td>
          <button class="remove-btn" onclick="removeFromCart(${item.id}); renderCart();">Remove</button>
        </td>
      </tr>
    `
    )
    .join("");

  container.innerHTML = `
    <table class="cart-table">
      <thead>
        <tr><th>Product</th><th>Price</th><th>Qty</th><th>Subtotal</th><th></th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="cart-total">
      <h2>Total: ₹${getCartTotal()}</h2>
      <button class="checkout-btn" onclick="window.location.href='payment.html'">Proceed to Checkout</button>
    </div>
  `;
}

document.addEventListener("DOMContentLoaded", renderCart);
