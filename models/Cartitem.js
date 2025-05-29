const mongoose = require('mongoose');

const CartItemSchema = new mongoose.Schema({
  cartId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cart' },
  userId: { type: String, required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  productName: { type: String },
  productType: { type: String },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  image: { type: String },
});

module.exports = mongoose.model('CartItem', CartItemSchema);