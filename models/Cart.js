const mongoose = require('mongoose');

const CartSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  totalItems: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },
});

module.exports = mongoose.model('Cart', CartSchema);