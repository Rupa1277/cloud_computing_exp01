const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  razorpayOrderId: { type: String, required: true },
  razorpayPaymentId: String,
  razorpaySignature: String,
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  status: { type: String, default: 'created' } // created, paid, failed
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);