const  mongoose = require("mongoose");
const Cart = require("../../models/Cart");
const CartItem = require("../../models/Cartitem");
const Product = require("../../models/Products");

exports.addToCart = async (req, res) => {
  try {
    if (
      typeof req.body !== "object" ||
      req.body === null ||
      Array.isArray(req.body)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid request body",
      });
    }

    const { userId, productId, quantity } = req.body;

    // Validate input types
    if (typeof productId !== "string" || typeof quantity !== "number") {
      return res.status(400).json({
        success: false,
        message: "Invalid input types",
      });
    }

    // Validate input
    if (!productId || !quantity) {
      return res.status(400).json({
        success: false,
        message: "Product ID and quantity are required",
      });
    }

    // Validate productId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Product ID",
      });
    }

    // Find or create cart
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = await Cart.create({ userId });
    }

    // Find product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Calculate price (simple price * quantity)
    const itemPrice = product.salePrice;
    const totalPrice = itemPrice * quantity;

    // Check if item already exists in cart
    let cartItem = await CartItem.findOne({
      cartId: cart._id,
      productId: product._id,
    });

    if (cartItem) {
      // Update existing item
      cartItem.quantity += quantity;
      cartItem.price = itemPrice;
      await cartItem.save();
    } else {
      // Create new cart item using only the fields in the schema
      cartItem = await CartItem.create({
        cartId: cart._id,
        userId,
        productId: product._id,
        quantity,
        price: itemPrice,
        productType: product.category,
        productName: product.productName,
        image: product.image1,
      });
    }

    // Update cart totals
    const cartItems = await CartItem.find({ cartId: cart._id });
    cart.totalItems = cartItems.length;
    cart.totalAmount = cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    await cart.save();

    // Get updated cart items
    const updatedItems = await CartItem.find({ cartId: cart._id }).populate(
      "productId"
    );

    res.status(200).json({
      success: true,
      data: {
        cart,
        items: updatedItems,
      },
    });
  } catch (error) {
    console.error("Add to cart error:", error);
    res.status(500).json({
      success: false,
      message: "Error adding item to cart",
      error: error.message,
    });
  }
};

exports.fetchCartItems = async (req, res) => {
  try {
    const { userId } = req.params;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(200).json({
        success: true,
        data: {
          cart: { totalItems: 0, totalAmount: 0 },
          items: [],
        },
      });
    }

    const cartItems = await CartItem.find({ cartId: cart._id }).populate(
      "productId"
    );

    res.status(200).json({
      success: true,
      data: {
        cart,
        items: cartItems,
      },
    });
  } catch (error) {
    console.error("Fetch cart error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching cart items",
      error: error.message,
    });
  }
};

exports.updateCartItemQuantity = async (req, res) => {
  try {
    const { userId, itemId, quantity } = req.body;

    if (!userId || !itemId || !quantity) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid item ID",
      });
    }

    const cartItem = await CartItem.findById(itemId);
    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found",
      });
    }

    cartItem.quantity = quantity;
    await cartItem.save();

    // Update cart totals
    const cart = await Cart.findOne({ userId });
    const cartItems = await CartItem.find({ cartId: cart._id });
    cart.totalItems = cartItems.length;
    cart.totalAmount = cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    await cart.save();

    // Get updated items
    const updatedItems = await CartItem.find({ cartId: cart._id }).populate(
      "productId"
    );

    res.status(200).json({
      success: true,
      data: {
        cart,
        items: updatedItems,
      },
    });
  } catch (error) {
    console.error("Update quantity error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating quantity",
      error: error.message,
    });
  }
};

exports.deleteCartItem = async (req, res) => {
  try {
    const { userId, itemId } = req.params;
    console.log("Delete request received:", { userId, itemId }); // Debug log

    // Input validation
    if (!userId || !itemId) {
      console.log("Missing userId or itemId"); // Debug log
      return res.status(400).json({
        success: false,
        message: "Invalid data provided! Missing userId or itemId",
      });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      console.log("Invalid ObjectId format:", itemId); // Debug log
      return res.status(400).json({
        success: false,
        message: "Invalid item ID format!",
      });
    }

    // Find the cart
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      console.log("Cart not found for userId:", userId); // Debug log
      return res.status(404).json({
        success: false,
        message: "Cart not found!",
      });
    }

    // Find and delete the cart item
    const deletedItem = await CartItem.findOneAndDelete({
      _id: itemId,
      cartId: cart._id,
    });

    if (!deletedItem) {
      console.log("Item not found:", itemId); // Debug log
      return res.status(404).json({
        success: false,
        message: "Item not found in cart!",
      });
    }

    // Update cart totals
    const remainingItems = await CartItem.find({ cartId: cart._id });
    cart.totalItems = remainingItems.length;
    cart.totalAmount = remainingItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    await cart.save();

    // Get updated cart items with product details
    const updatedItems = await CartItem.find({ cartId: cart._id }).populate(
      "productId"
    );

    console.log("Delete successful, remaining items:", remainingItems.length); // Debug log

    res.status(200).json({
      success: true,
      data: {
        cart,
        items: updatedItems,
      },
    });
  } catch (error) {
    console.error("Delete cart item error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting cart item",
      error: error.message,
    });
  }
};

exports.cartitemcount = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(200).json({
        success: true,
        data: { itemCount: 0 },
      });
    }

    res.status(200).json({
      success: true,
      data: { itemCount: cart.totalItems },
    });
  } catch (error) {
    console.error("Count cart item error:", error);
    res.status(500).json({
      success: false,
      message: "Error counting cart items",
      error: error.message,
    });
  }
};

exports.emptyCart = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    await CartItem.deleteMany({ cartId: cart._id });

    cart.totalItems = 0;
    cart.totalAmount = 0;
    await cart.save();

    res.status(200).json({
      success: true,
      message: "Cart emptied successfully",
    });
  } catch (error) {
    console.error("Empty cart error:", error);
    res.status(500).json({
      success: false,
      message: "Error emptying cart",
      error: error.message,
    });
  }
};