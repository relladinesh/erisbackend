  const { imageUploadUtil } = require("../../helper/Cloudinary");

const Product = require("../../models/Products");

const getCurrentUTCDateTime = () => {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
};

// Handle image upload with tracking
const handleImageUpload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const b64 = Buffer.from(req.file.buffer).toString("base64");
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;

    // Upload to Cloudinary with user tracking
    const result = await imageUploadUtil(dataURI, "admin");

    res.json({
      success: true,
      result: {
        url: result.url,
      },
    });
  } catch (error) {
    console.error("Image upload error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error uploading image",
    });
  }
};

// Add a new product
const addProduct = async (req, res) => {
  try {
    const {
      image1,
      image2,
      image3,
      image4,
      productName,
      description,
      productType,
      category,
      color,
      trend,
      price,
      salePrice,
      discount,
      stockQuantity,
      popularity,
    } = req.body;

    // Validate required fields
    if (
      !image1 ||
      !productName ||
      !description ||
      !productType ||
      !price ||
      !salePrice ||
      !stockQuantity
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Create new product with schema fields
    const newProduct = new Product({
      image1,
      image2: image2 || "",
      image3: image3 || "",
      image4: image4 || "",
      productName,
      description,
      productType,
      category: category || "",
      color: color || "",
      trend: trend || "",
      price: Number(price),
      salePrice: Number(salePrice),
      discount: discount
        ? Number(discount)
        : Math.round(((price - salePrice) / price) * 100),
      stockQuantity: Number(stockQuantity),
      popularity: Number(popularity || 0),
      createdAt: getCurrentUTCDateTime(),
      createdBy: "admin",
      updatedAt: getCurrentUTCDateTime(),
      updatedBy: "admin",
    });

    await newProduct.save();

    res.status(201).json({
      success: true,
      data: newProduct,
    });
  } catch (error) {
    console.error("Add product error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error adding product",
    });
  }
};

// Fetch all products
const fetchAllProducts = async (req, res) => {
  try {
    const products = await Product.find({})
      .sort({ createdAt: -1 })
      .select("-__v");

    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    console.error("Fetch products error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching products",
    });
  }
};

// Fetch products by type
const fetchProductsByType = async (req, res) => {
  try {
    const { productType } = req.params;

    if (!productType) {
      return res.status(400).json({
        success: false,
        message: "Product type is required",
      });
    }

    const products = await Product.find({ productType })
      .sort({ createdAt: -1 })
      .select("-__v");

    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    console.error("Fetch products by type error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching products",
    });
  }
};

// Edit a product
const editProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (
      (updates.productName !== undefined && updates.productName === "") ||
      (updates.description !== undefined && updates.description === "") ||
      (updates.productType !== undefined && updates.productType === "") ||
      (updates.price !== undefined && updates.price === "") ||
      (updates.salePrice !== undefined && updates.salePrice === "") ||
      (updates.stockQuantity !== undefined && updates.stockQuantity === "") ||
      (updates.image1 !== undefined && updates.image1 === "")
    ) {
      return res.status(400).json({
        success: false,
        message: "Required fields cannot be empty",
      });
    }

    // Process numeric fields
    if (updates.price) updates.price = Number(updates.price);
    if (updates.salePrice) updates.salePrice = Number(updates.salePrice);
    if (updates.discount) {
      updates.discount = Number(updates.discount);
    } else if (updates.price && updates.salePrice) {
      updates.discount = Math.round(
        ((updates.price - updates.salePrice) / updates.price) * 100
      );
    }
    if (updates.stockQuantity)
      updates.stockQuantity = Number(updates.stockQuantity);
    if (updates.popularity) updates.popularity = Number(updates.popularity);

    // Update fields
    Object.keys(updates).forEach((key) => {
      if (updates[key] !== undefined) {
        product[key] = updates[key];
      }
    });

    // Update audit fields
    product.updatedAt = getCurrentUTCDateTime();
    product.updatedBy = "admin";

    await product.save();

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Edit product error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error updating product",
    });
  }
};

// Delete a product
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    await Product.deleteOne({ _id: id });

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error deleting product",
    });
  }
};

module.exports = {
  handleImageUpload,
  addProduct,
  fetchAllProducts,
  fetchProductsByType,
  editProduct,
  deleteProduct,
};