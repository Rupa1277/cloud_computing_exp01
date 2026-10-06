const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const Razorpay = require("razorpay");
const db = require("../db");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// POST /api/payment/create-order
// body: { amount: <number in rupees>, items: [...] }
router.post("/create-order", async (req, res) => {
  try {
    const { amount, items } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const options = {
      amount: Math.round(amount * 100), // Razorpay wants amount in paise
      currency: "INR",
      receipt: "receipt_" + Date.now(),
    };

    const razorpayOrder = await razorpay.orders.create(options);

    // Save a preliminary order record in SQLite with status "created"
    const insert = db.prepare(`
      INSERT INTO orders (items, amount, currency, razorpay_order_id, status)
      VALUES (?, ?, 'INR', ?, 'created')
    `);
    const result = insert.run(JSON.stringify(items || []), amount, razorpayOrder.id);

    res.json({
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: process.env.RAZORPAY_KEY_ID, // public key, safe to send to frontend
      dbOrderId: result.lastInsertRowid,
    });
  } catch (err) {
    console.error("create-order error:", err);
    res.status(500).json({ message: "Failed to create Razorpay order" });
  }
});

// POST /api/payment/verify
// body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, customerName, customerEmail }
router.post("/verify", (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      customerName,
      customerEmail,
    } = req.body;

    // Recreate the expected signature using our secret key
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    const isValid = generatedSignature === razorpay_signature;

    if (!isValid) {
      db.prepare("UPDATE orders SET status = 'failed' WHERE razorpay_order_id = ?").run(
        razorpay_order_id
      );
      return res.status(400).json({ success: false, message: "Signature verification failed" });
    }

    db.prepare(`
      UPDATE orders
      SET razorpay_payment_id = ?, razorpay_signature = ?, customer_name = ?, customer_email = ?, status = 'paid'
      WHERE razorpay_order_id = ?
    `).run(razorpay_payment_id, razorpay_signature, customerName || "", customerEmail || "", razorpay_order_id);

    const order = db
      .prepare("SELECT * FROM orders WHERE razorpay_order_id = ?")
      .get(razorpay_order_id);

    res.json({ success: true, message: "Payment verified successfully", order });
  } catch (err) {
    console.error("verify error:", err);
    res.status(500).json({ success: false, message: "Payment verification failed" });
  }
});

module.exports = router;
