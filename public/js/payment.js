// payment.js - handles the checkout / payment page

function renderOrderSummary() {
  const cart = getCart();
  const summaryEl = document.getElementById("order-summary");

  if (cart.length === 0) {
    summaryEl.innerHTML = "<p>Your cart is empty.</p>";
    document.getElementById("payment-form").style.display = "none";
    return;
  }

  const rows = cart
    .map(
      (item) => `
      <div class="summary-row">
        <span>${item.name} x ${item.qty}</span>
        <span>₹${item.price * item.qty}</span>
      </div>
    `
    )
    .join("");

  summaryEl.innerHTML = `
    <h2>Order Summary</h2>
    ${rows}
    <div class="summary-row total">
      <span>Total</span>
      <span>₹${getCartTotal()}</span>
    </div>
  `;
}

function showResult(type, message) {
  const resultEl = document.getElementById("payment-result");
  const formSection = document.getElementById("checkout-section");
  formSection.style.display = "none";
  resultEl.style.display = "block";
  resultEl.className = "payment-result " + type;
  resultEl.innerHTML = `
    <h1>${type === "success" ? "Payment Successful 🎉" : "Payment Failed"}</h1>
    <p>${message}</p>
    ${
      type === "success"
        ? '<button onclick="window.location.href=\'index.html\'">Continue Shopping</button>'
        : '<button onclick="window.location.reload()">Try Again</button>'
    }
  `;
}

async function handlePayment(e) {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const errorEl = document.getElementById("form-error");
  const payBtn = document.getElementById("pay-btn");
  errorEl.textContent = "";

  if (!name || !email) {
    errorEl.textContent = "Please enter your name and email.";
    return;
  }

  const cart = getCart();
  const amount = getCartTotal();

  payBtn.disabled = true;
  payBtn.textContent = "Processing...";

  try {
    // 1. Ask backend to create a Razorpay order
    const createRes = await fetch("/api/payment/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount,
        items: cart.map((item) => ({
          productId: item.id,
          name: item.name,
          price: item.price,
          qty: item.qty,
        })),
      }),
    });

    if (!createRes.ok) throw new Error("Failed to create order");
    const orderData = await createRes.json();

    // 2. Open Razorpay Checkout
    const options = {
      key: orderData.key,
      amount: orderData.amount,
      currency: orderData.currency,
      name: "ShopEasy",
      description: "Mini E-commerce Order",
      order_id: orderData.orderId,
      handler: async function (response) {
        try {
          const verifyRes = await fetch("/api/payment/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              customerName: name,
              customerEmail: email,
            }),
          });
          const verifyData = await verifyRes.json();

          if (verifyData.success) {
            clearCart();
            showResult("success", `Thank you, ${name}! Your order has been placed.`);
          } else {
            showResult("failed", "Payment verification failed. Please try again.");
          }
        } catch (err) {
          console.error(err);
          showResult("failed", "Something went wrong while verifying your payment.");
        } finally {
          payBtn.disabled = false;
          payBtn.textContent = `Pay ₹${amount}`;
        }
      },
      modal: {
        ondismiss: function () {
          payBtn.disabled = false;
          payBtn.textContent = `Pay ₹${amount}`;
        },
      },
      prefill: { name, email },
      theme: { color: "#1a73e8" },
    };

    const rzp = new Razorpay(options);
    rzp.on("payment.failed", function () {
      showResult("failed", "The payment was declined or cancelled.");
      payBtn.disabled = false;
      payBtn.textContent = `Pay ₹${amount}`;
    });
    rzp.open();
  } catch (err) {
    console.error(err);
    errorEl.textContent = "Could not start payment. Please check the server and try again.";
    payBtn.disabled = false;
    payBtn.textContent = `Pay ₹${amount}`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  renderOrderSummary();
  const form = document.getElementById("payment-form");
  if (form) form.addEventListener("submit", handlePayment);

  const amount = getCartTotal();
  const payBtn = document.getElementById("pay-btn");
  if (payBtn) payBtn.textContent = `Pay ₹${amount}`;
});
